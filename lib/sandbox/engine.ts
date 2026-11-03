import type {
  AgentId,
  DecisionItem,
  HistoryItem,
  Member,
  Message,
  ProposedAction,
  SandboxInputs,
  SandboxState,
  Severity,
  TaskItem,
} from "./types";
import { DEFAULT_INPUTS } from "./presets";

const SEVERITY_SCORE: Record<Severity, number> = {
  SEV1: 92,
  SEV2: 71,
  SEV3: 48,
};

const SENSITIVITY_DELTA = { low: -12, med: 0, high: 14 } as const;

const SERVICE_ROLLBACK: Record<
  SandboxInputs["service"],
  { target: string; version: string; previous: string }
> = {
  checkout: {
    target: "checkout-api",
    version: "v2.14.3",
    previous: "v2.14.1",
  },
  auth: {
    target: "auth-gateway",
    version: "v1.9.0",
    previous: "v1.8.7",
  },
  payments: {
    target: "payments-router",
    version: "v4.2.1",
    previous: "v4.1.9",
  },
  search: {
    target: "search-indexer",
    version: "v0.8.4",
    previous: "v0.8.2",
  },
};

function clock(offsetSec: number): string {
  const base = new Date("2026-11-03T02:14:00Z");
  base.setSeconds(base.getSeconds() + offsetSec);
  return base.toISOString().slice(11, 19) + "Z";
}

function membersFrom(agents: Record<AgentId, boolean>): Member[] {
  const list: Member[] = [
    {
      id: "you",
      name: "You (on-call)",
      role: "human",
      status: "online",
      initials: "YO",
    },
  ];
  if (agents.triager) {
    list.push({
      id: "triager",
      name: "inc-triager",
      role: "agent",
      agentId: "triager",
      status: "online",
      initials: "TR",
    });
  }
  if (agents.reproducer) {
    list.push({
      id: "reproducer",
      name: "inc-repro",
      role: "agent",
      agentId: "reproducer",
      status: "busy",
      initials: "RP",
    });
  }
  if (agents.release) {
    list.push({
      id: "release",
      name: "inc-release",
      role: "agent",
      agentId: "release",
      status: "online",
      initials: "RL",
    });
  }
  return list;
}

function extractSignal(log: string): string {
  const m =
    log.match(/status=(\d+)/i) ||
    log.match(/latency_p99=([\d.]+ms)/i) ||
    log.match(/error_rate=([\d.]+%)/i) ||
    log.match(/p99=([\d.]+ms)/i);
  if (m) return m[0];
  const short = log.trim().slice(0, 72);
  return short || "no signal in log";
}

function scoreOf(inputs: SandboxInputs): number {
  let s = SEVERITY_SCORE[inputs.severity] + SENSITIVITY_DELTA[inputs.sensitivity];
  if (/500|circuit=open|error_rate/i.test(inputs.logSnippet)) s += 6;
  if (!inputs.agents.reproducer) s -= 8;
  if (!inputs.agents.release) s -= 5;
  return Math.max(20, Math.min(99, s));
}

function propose(inputs: SandboxInputs, score: number): ProposedAction | null {
  if (!inputs.agents.release) return null;
  if (inputs.sensitivity === "low" && inputs.severity === "SEV3") return null;
  const rb = SERVICE_ROLLBACK[inputs.service];
  const aggressive = inputs.sensitivity === "high" || inputs.severity === "SEV1";
  const command = aggressive
    ? `kubectl rollout undo deploy/${rb.target} --to-revision=${rb.previous}`
    : `featureflag disable ${rb.target}.canary && notify #${inputs.service}-oncall`;
  return {
    id: `prop-${inputs.service}-${inputs.severity}-${inputs.sensitivity}`,
    title: aggressive
      ? `Rollback ${rb.target} to ${rb.previous}`
      : `Disable ${rb.target} canary`,
    command,
    risk: aggressive
      ? "Production deploy change — human Confirm required"
      : "Traffic shift only — still needs Confirm before apply",
    rationale: `Score ${score}. Signal: ${extractSignal(inputs.logSnippet)}. Service ${inputs.service} at ${rb.version}.`,
  };
}

function buildMessages(
  inputs: SandboxInputs,
  proposed: ProposedAction | null,
  score: number
): Message[] {
  const msgs: Message[] = [];
  let t = 0;
  const signal = extractSignal(inputs.logSnippet);
  const rb = SERVICE_ROLLBACK[inputs.service];

  msgs.push({
    id: "m0",
    authorId: "you",
    authorName: "You (on-call)",
    kind: "human",
    body: `@inc-triager ${inputs.severity} on ${inputs.service}: ${signal}. Log snippet attached.`,
    at: clock(t),
    mentions: ["inc-triager"],
  });
  t += 18;

  if (inputs.agents.triager) {
    const route = inputs.agents.reproducer
      ? `@inc-repro please reproduce against ${rb.target} using the log signal.`
      : `No reproducer in room — classifying from log alone.`;
    msgs.push({
      id: "m1",
      authorId: "triager",
      authorName: "inc-triager",
      kind: "agent",
      body: `Restated: ${inputs.severity} ${inputs.service} degradation (${signal}). Class: bug / production. Open reports: 1. ${route}`,
      at: clock(t),
      mentions: inputs.agents.reproducer ? ["inc-repro"] : undefined,
    });
    t += 42;
  } else {
    msgs.push({
      id: "m1s",
      authorId: "system",
      authorName: "Switch",
      kind: "system",
      body: "Triager disabled — human holds routing. Other agents wait for an @mention.",
      at: clock(t),
    });
    t += 12;
  }

  if (inputs.agents.reproducer) {
    const reproduced =
      inputs.severity !== "SEV3" || inputs.sensitivity === "high";
    msgs.push({
      id: "m2",
      authorId: "reproducer",
      authorName: "inc-repro",
      kind: "agent",
      body: reproduced
        ? `Reproduced. Ran curl against staging ${rb.target}: same ${signal}. Suspect ${rb.version} canary. Cause guess: bad route table / pool exhaustion.`
        : `Could not hard-reproduce on staging (sensitivity=${inputs.sensitivity}). Soft signal only; holding a full rollback recommendation.`,
      at: clock(t),
    });
    t += 55;
  }

  if (inputs.agents.release && proposed) {
    msgs.push({
      id: "m3",
      authorId: "release",
      authorName: "inc-release",
      kind: "agent",
      body: `Proposed action (waiting on human Confirm):\n${proposed.title}\n\`${proposed.command}\`\nRisk: ${proposed.risk}\n${proposed.rationale}`,
      at: clock(t),
      mentions: ["You"],
    });
  } else if (!inputs.agents.release) {
    msgs.push({
      id: "m3s",
      authorId: "system",
      authorName: "Switch",
      kind: "system",
      body: "Release agent off — no production change will be proposed. Room stays investigative.",
      at: clock(t),
    });
  }

  return msgs;
}

function buildTasks(
  inputs: SandboxInputs,
  proposed: ProposedAction | null
): TaskItem[] {
  const tasks: TaskItem[] = [
    {
      id: "t1",
      title: `Classify ${inputs.severity} ${inputs.service}`,
      owner: inputs.agents.triager ? "inc-triager" : "You",
      status: "done",
    },
  ];
  if (inputs.agents.reproducer) {
    tasks.push({
      id: "t2",
      title: `Reproduce ${extractSignal(inputs.logSnippet)}`,
      owner: "inc-repro",
      status: inputs.severity === "SEV3" && inputs.sensitivity === "low" ? "blocked" : "done",
    });
  }
  if (proposed) {
    tasks.push({
      id: "t3",
      title: `Await Confirm: ${proposed.title}`,
      owner: "You",
      status: "doing",
    });
  }
  tasks.push({
    id: "t4",
    title: "Write incident timeline",
    owner: inputs.agents.release ? "inc-release" : "You",
    status: "todo",
  });
  return tasks;
}

function buildDecisions(proposed: ProposedAction | null): DecisionItem[] {
  if (!proposed) return [];
  return [
    {
      id: proposed.id,
      title: proposed.title,
      proposedBy: "inc-release",
      action: proposed.command,
      status: "pending",
      detail: proposed.risk,
    },
  ];
}

function buildHistory(inputs: SandboxInputs, score: number): HistoryItem[] {
  return [
    {
      id: "h1",
      at: clock(0),
      label: `Room opened · preset ${inputs.presetId} · score ${score}`,
    },
    {
      id: "h2",
      at: clock(18),
      label: `Human reported ${inputs.severity} on ${inputs.service}`,
    },
    {
      id: "h3",
      at: clock(60),
      label: `Agents active: ${Object.entries(inputs.agents)
        .filter(([, on]) => on)
        .map(([k]) => k)
        .join(", ") || "none"}`,
    },
  ];
}

export function recompute(
  inputs: SandboxInputs,
  runId = 1,
  prior?: Pick<SandboxState, "editedCommand" | "status" | "decisions">
): SandboxState {
  const score = scoreOf(inputs);
  let proposed = propose(inputs, score);
  if (proposed && prior?.editedCommand) {
    proposed = { ...proposed, command: prior.editedCommand };
  }
  const status = prior?.status && prior.status !== "open" && prior.status !== "awaiting"
    ? prior.status
    : proposed
      ? "awaiting"
      : "open";

  let decisions = buildDecisions(proposed);
  if (prior?.decisions?.length && prior.status !== "open") {
    decisions = prior.decisions;
  }

  return {
    inputs,
    members: membersFrom(inputs.agents),
    messages: buildMessages(inputs, proposed, score),
    tasks: buildTasks(inputs, proposed),
    decisions,
    history: buildHistory(inputs, score),
    proposed: status === "dismissed" || status === "closed" ? null : proposed,
    status: proposed && status === "open" ? "awaiting" : status,
    severityScore: score,
    editedCommand: prior?.editedCommand ?? null,
    runId,
  };
}

export function applyDecision(
  state: SandboxState,
  action: "confirm" | "edit" | "dismiss",
  editedCommand?: string
): SandboxState {
  const now = clock(120 + state.runId * 3);
  const decisions = state.decisions.map((d) => {
    if (d.status !== "pending") return d;
    if (action === "confirm") return { ...d, status: "confirmed" as const };
    if (action === "dismiss") return { ...d, status: "dismissed" as const };
    return {
      ...d,
      status: "edited" as const,
      action: editedCommand ?? d.action,
    };
  });

  const history: HistoryItem[] = [
    ...state.history,
    {
      id: `h-dec-${action}-${state.runId}`,
      at: now,
      label:
        action === "confirm"
          ? "Human confirmed production action"
          : action === "dismiss"
            ? "Human dismissed proposal"
            : "Human edited proposal — re-queue Confirm",
    },
  ];

  if (action === "edit" && editedCommand) {
    const proposed: ProposedAction = {
      ...(state.proposed ?? {
        id: "edited",
        title: "Edited action",
        command: editedCommand,
        risk: "Edited by human — Confirm still required",
        rationale: "Human revised the command in-room.",
      }),
      command: editedCommand,
      risk: "Edited by human — Confirm still required",
    };
    const messages: Message[] = [
      ...state.messages,
      {
        id: `m-edit-${state.runId}`,
        authorId: "you",
        authorName: "You (on-call)",
        kind: "human",
        body: `Edited proposal to:\n\`${editedCommand}\`\n@inc-release hold for Confirm.`,
        at: now,
        mentions: ["inc-release"],
      },
    ];
    return {
      ...state,
      messages,
      decisions: decisions.map((d) =>
        d.status === "edited"
          ? { ...d, status: "pending", action: editedCommand, detail: proposed.risk }
          : d
      ),
      history,
      proposed,
      editedCommand,
      status: "awaiting",
      tasks: state.tasks.map((t) =>
        t.id === "t3"
          ? { ...t, title: `Await Confirm: ${proposed.title}`, status: "doing" }
          : t
      ),
      runId: state.runId + 1,
    };
  }

  if (action === "dismiss") {
    return {
      ...state,
      decisions,
      history,
      proposed: null,
      status: "dismissed",
      messages: [
        ...state.messages,
        {
          id: `m-dismiss-${state.runId}`,
          authorId: "you",
          authorName: "You (on-call)",
          kind: "human",
          body: "Dismissed. Do not apply. Continue observation only.",
          at: now,
        },
        ...(state.inputs.agents.release
          ? [
              {
                id: `m-dismiss-ack-${state.runId}`,
                authorId: "release",
                authorName: "inc-release",
                kind: "agent" as const,
                body: "Acknowledged. Proposal withdrawn. Room stays open for triage notes.",
                at: clock(125 + state.runId * 3),
              },
            ]
          : []),
      ],
      tasks: state.tasks.map((t) =>
        t.id === "t3" ? { ...t, status: "blocked" as const, title: "Proposal dismissed" } : t
      ),
      runId: state.runId + 1,
    };
  }

  // confirm
  const cmd = state.proposed?.command ?? state.decisions[0]?.action ?? "(none)";
  return {
    ...state,
    decisions,
    history: [
      ...history,
      {
        id: `h-close-${state.runId}`,
        at: clock(130 + state.runId * 3),
        label: "Incident closed in-room",
      },
    ],
    proposed: null,
    status: "closed",
    messages: [
      ...state.messages,
      {
        id: `m-confirm-${state.runId}`,
        authorId: "you",
        authorName: "You (on-call)",
        kind: "human",
        body: `Confirm. Apply:\n\`${cmd}\``,
        at: now,
      },
      ...(state.inputs.agents.release
        ? [
            {
              id: `m-close-${state.runId}`,
              authorId: "release",
              authorName: "inc-release",
              kind: "agent" as const,
              body: `Applied under your Confirm. ${state.inputs.service} recovering. Timeline written. Closing incident.`,
              at: clock(135 + state.runId * 3),
            },
          ]
        : []),
    ],
    tasks: state.tasks.map((t) =>
      t.id === "t3" || t.id === "t4" ? { ...t, status: "done" as const } : t
    ),
    runId: state.runId + 1,
  };
}

export function initialState(): SandboxState {
  return recompute(DEFAULT_INPUTS, 1);
}
