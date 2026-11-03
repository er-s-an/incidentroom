import type {
  ActorId,
  AgentFlags,
  Decision,
  HistoryEvent,
  LogSignals,
  Member,
  Message,
  ProposedAction,
  Rule,
  SandboxInputs,
  SandboxResult,
  ScorePart,
  Sensitivity,
  Service,
  Severity,
  Task,
} from "./types";

interface Catalog {
  name: string;
  api: string;
  lastGood: string;
  lastBad: string;
  shaGood: string;
  shaBad: string;
  route: string;
  repro: string;
  cluster: string;
  canary: string;
  flag: string;
  clock: string;
  human: { name: string; handle: string; initials: string };
}

const CATALOG: Record<Service, Catalog> = {
  checkout: {
    name: "Checkout",
    api: "checkout-api",
    lastGood: "v2.13.2",
    lastBad: "v2.14.0",
    shaGood: "c8e21aa",
    shaBad: "a3f91c2",
    route: "POST /checkout/complete",
    repro: "POST /checkout/complete with a valid cart and promo=LAUNCH14",
    cluster: "checkout-prod",
    canary: "checkout-canary",
    flag: "checkout.tax_quote_v2",
    clock: "23:11",
    human: { name: "Ravi Okonkwo", handle: "ravi", initials: "RO" },
  },
  auth: {
    name: "Auth",
    api: "auth-gateway",
    lastGood: "v4.1.8",
    lastBad: "v4.2.1",
    shaGood: "9c20e14",
    shaBad: "e11b0c9",
    route: "POST /oauth/token",
    repro: "POST /oauth/token against session-store with a 3s deadline",
    cluster: "auth-prod",
    canary: "auth-canary",
    flag: "auth.session_store_deadline_ms",
    clock: "22:41",
    human: { name: "Noor Hale", handle: "noor", initials: "NH" },
  },
  payments: {
    name: "Payments",
    api: "payments-ledger",
    lastGood: "v9.7.4",
    lastBad: "v9.8.0",
    shaGood: "71aa0c2",
    shaBad: "bb17e4d",
    route: "POST /capture",
    repro: "POST /capture with a settled intent and a 350ms SLO timer",
    cluster: "payments-prod",
    canary: "payments-canary",
    flag: "payments.capture_worker_concurrency",
    clock: "01:02",
    human: { name: "Priya Shah", handle: "priya", initials: "PS" },
  },
  search: {
    name: "Search",
    api: "search-index",
    lastGood: "v1.18.3",
    lastBad: "v1.19.0",
    shaGood: "0bb91e4",
    shaBad: "d44aa01",
    route: "GET /search",
    repro: "GET /search?q=products on replica-3 with ranking-model loaded",
    cluster: "search-prod",
    canary: "search-canary",
    flag: "search.ranking_model_v19",
    clock: "03:18",
    human: { name: "Sam Ibarra", handle: "sam", initials: "SI" },
  },
};

const SEV_BASE: Record<Severity, number> = { SEV1: 78, SEV2: 52, SEV3: 28 };
const SENS_DELTA: Record<Sensitivity, number> = { low: -10, med: 0, high: 14 };
const SENS_LABEL: Record<Sensitivity, string> = {
  low: "low",
  med: "medium",
  high: "high",
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function fingerprint(inputs: SandboxInputs): string {
  const raw = [
    inputs.severity,
    inputs.service,
    inputs.sensitivity,
    inputs.logSnippet.replace(/\s+/g, " ").slice(0, 120),
    inputs.agents.triager ? "T" : "t",
    inputs.agents.reproducer ? "R" : "r",
    inputs.agents.release ? "L" : "l",
    inputs.editedAction ?? "",
  ].join("|");
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).slice(0, 4).toUpperCase();
}

function addMinutes(clock: string, minutes: number): string {
  const [h, m] = clock.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function parseLog(log: string): LogSignals {
  const text = log.trim();
  const statuses = [...text.matchAll(/\b([45]\d{2})\b/g)].map((m) => Number(m[1]));
  const latencies = [
    ...text.matchAll(/\b(\d{2,5})\s*ms\b/gi),
    ...text.matchAll(/\bp9[59]=(\d+)/gi),
    ...text.matchAll(/\bp99=(\d+)/gi),
  ].map((m) => Number(m[1]));
  const shas = [...text.matchAll(/\bsha[=:]?\s*([a-f0-9]{7,40})\b/gi)].map((m) => m[1].slice(0, 7));
  const versions = [...text.matchAll(/\bv\d+\.\d+\.\d+\b/g)].map((m) => m[0]);
  const rateMatch = text.match(/error_rate\s+(\d+(?:\.\d+)?)\s*%/i);
  const excerpt =
    text
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 8) ?? "";
  return {
    statuses: [...new Set(statuses)],
    latencies,
    shas: [...new Set(shas)],
    versions: [...new Set(versions)],
    hasTimeout: /timeout|timed out|deadline/i.test(text),
    hasPanic: /panic|nil pointer|segfault|fatal/i.test(text),
    hasOom: /\boom\b|out of memory/i.test(text),
    errorRate: rateMatch ? Number(rateMatch[1]) : null,
    excerpt,
    empty: text.length < 8,
  };
}

function scoreOf(inputs: SandboxInputs, signals: LogSignals): { total: number; parts: ScorePart[] } {
  const parts: ScorePart[] = [
    { label: `${inputs.severity} floor`, points: SEV_BASE[inputs.severity] },
    { label: `${SENS_LABEL[inputs.sensitivity]} sensitivity`, points: SENS_DELTA[inputs.sensitivity] },
  ];
  if (signals.statuses.some((s) => s >= 500)) parts.push({ label: "5xx in the snippet", points: 12 });
  else if (signals.statuses.some((s) => s >= 400)) parts.push({ label: "4xx in the snippet", points: 4 });
  if (signals.hasTimeout) parts.push({ label: "timeout / deadline", points: 8 });
  if (signals.hasPanic) parts.push({ label: "panic in process", points: 10 });
  if (signals.hasOom) parts.push({ label: "OOM", points: 9 });
  const maxLatency = signals.latencies.length ? Math.max(...signals.latencies) : 0;
  if (maxLatency >= 2000) parts.push({ label: `latency ${maxLatency}ms`, points: 10 });
  else if (maxLatency >= 800) parts.push({ label: `latency ${maxLatency}ms`, points: 6 });
  if (signals.errorRate != null && signals.errorRate >= 10) {
    parts.push({ label: `error rate ${signals.errorRate}%`, points: 8 });
  } else if (signals.errorRate != null && signals.errorRate >= 3) {
    parts.push({ label: `error rate ${signals.errorRate}%`, points: 4 });
  }
  if (signals.versions.length || signals.shas.length) parts.push({ label: "deploy mentioned", points: 4 });
  if (signals.empty) parts.push({ label: "empty log", points: -18 });
  if (!inputs.agents.reproducer) parts.push({ label: "unreproduced", points: -6 });
  const total = clamp(parts.reduce((sum, part) => sum + part.points, 0), 8, 99);
  return { total, parts };
}

function actionKind(
  score: number,
  severity: Severity,
  sensitivity: Sensitivity,
): ProposedAction["kind"] {
  if (signalsForceWatch(score, severity, sensitivity)) return "watch";
  if (severity === "SEV1" && sensitivity === "high") return "rollback";
  if (score >= 80 || (severity === "SEV1" && score >= 70)) return "rollback";
  if (score >= 55 || severity === "SEV2") return "canary-pause";
  if (severity === "SEV3" && sensitivity === "low") return "watch";
  return "flag";
}

function signalsForceWatch(score: number, severity: Severity, sensitivity: Sensitivity): boolean {
  return score < 36 && severity === "SEV3" && sensitivity === "low";
}

function buildAction(
  inputs: SandboxInputs,
  cat: Catalog,
  signals: LogSignals,
  score: number,
): ProposedAction {
  const kind = actionKind(score, inputs.severity, inputs.sensitivity);
  const sha = signals.shas[0] ?? cat.shaBad;
  const version = signals.versions[0] ?? cat.lastBad;
  const targetByKind: Record<ProposedAction["kind"], string> = {
    rollback: `${cat.api}@${cat.lastGood} (${cat.shaGood}), replacing ${version} / ${sha}`,
    "canary-pause": `${cat.canary} paused; rollback to ${cat.lastGood} staged, not applied`,
    flag: `flag ${cat.flag} off on ${cat.cluster}`,
    watch: `watch ${cat.route} for 15m; no production change`,
  };
  const commandByKind: Record<ProposedAction["kind"], string> = {
    rollback: `kubectl -n ${cat.cluster} rollout undo deploy/${cat.api} && kubectl -n ${cat.cluster} rollout status deploy/${cat.api}`,
    "canary-pause": `flagger pause ${cat.canary} && helm get manifest ${cat.api} > /tmp/${cat.api}-staged.yaml`,
    flag: `flag set ${cat.flag} false --cluster ${cat.cluster}`,
    watch: `watch -n 15 'curl -s localhost/metrics | grep ${cat.api}_error'`,
  };
  const titleByKind: Record<ProposedAction["kind"], string> = {
    rollback: `Rollback ${cat.api} to ${cat.lastGood}`,
    "canary-pause": `Pause ${cat.canary} and stage ${cat.lastGood}`,
    flag: `Turn off ${cat.flag}`,
    watch: `Watch ${cat.api} — no change yet`,
  };
  const riskByKind: Record<ProposedAction["kind"], string> = {
    rollback: `Full cluster ${cat.cluster}. Loses ${version}. ${inputs.severity} pages the on-call before apply.`,
    "canary-pause": `Stops new canary traffic. ${cat.cluster} stays on the last stable replica set until Confirm.`,
    flag: `Disables the new path without a deploy. ${cat.api} keeps serving ${cat.lastGood} behaviour.`,
    watch: `No production mutation. ${inputs.severity} at ${SENS_LABEL[inputs.sensitivity]} sensitivity stays observational.`,
  };
  const summary = inputs.editedAction?.trim()
    ? `Edited proposal: ${inputs.editedAction.trim()}`
    : `${titleByKind[kind]} after score ${score} on ${cat.route}.`;

  const command = inputs.editedAction?.trim() || commandByKind[kind];
  const target = inputs.editedAction?.trim()
    ? `edited: ${inputs.editedAction.trim().slice(0, 72)}`
    : targetByKind[kind];

  return {
    id: `act:${inputs.service}:${kind}:${sha}`,
    title: inputs.editedAction?.trim() ? "Edited production action" : titleByKind[kind],
    summary,
    target,
    command,
    waitForHuman: true,
    risk: riskByKind[kind],
    kind,
  };
}

function actorName(id: ActorId, team: string, cat: Catalog): { name: string; handle: string } {
  switch (id) {
    case "human":
      return { name: cat.human.name, handle: cat.human.handle };
    case "triager":
      return { name: `${team}-triager`, handle: `${team}-triager` };
    case "reproducer":
      return { name: `${team}-repro`, handle: `${team}-repro` };
    case "release":
      return { name: `${team}-release`, handle: `${team}-release` };
    default:
      return { name: "room", handle: "room" };
  }
}

function pushMessage(
  list: Message[],
  delay: number,
  clock: string,
  actor: ActorId,
  team: string,
  cat: Catalog,
  body: string,
  kind: Message["kind"] = "chat",
): number {
  const who = actorName(actor, team, cat);
  list.push({
    id: `m${list.length + 1}`,
    actor,
    name: who.name,
    handle: who.handle,
    body,
    at: clock,
    kind,
    delayMs: delay,
  });
  return delay;
}

function membersFor(team: string, cat: Catalog, agents: AgentFlags): Member[] {
  return [
    {
      id: "human",
      name: cat.human.name,
      handle: cat.human.handle,
      role: "on-call",
      online: true,
      initials: cat.human.initials,
    },
    {
      id: "triager",
      name: `${team}-triager`,
      handle: `${team}-triager`,
      role: "routes reports",
      online: agents.triager,
      initials: "TR",
    },
    {
      id: "reproducer",
      name: `${team}-repro`,
      handle: `${team}-repro`,
      role: "runs the failing path",
      online: agents.reproducer,
      initials: "RP",
    },
    {
      id: "release",
      name: `${team}-release`,
      handle: `${team}-release`,
      role: "proposes closeout",
      online: agents.release,
      initials: "RL",
    },
  ];
}

function rulesFor(team: string, cat: Catalog, agents: AgentFlags): Rule[] {
  const rules: Rule[] = [
    {
      name: "Room",
      body: `#${team}-oncall holds ${team}-triager, ${team}-repro, ${team}-release, and the on-call. Same YAML the Console applies.`,
    },
    {
      name: "Addressing",
      body: "Anyone in the room may address the triager. The reproducer answers the triager. The release agent answers after evidence is in the thread.",
    },
    {
      name: "Production gate",
      body: `A change to ${cat.cluster} waits for a named Confirm from the on-call. Edit rewrites the proposal. Dismiss stops that action. Switch does not enforce this; the release instructions do.`,
    },
  ];
  if (agents.triager) {
    rules.push({
      name: `${team}-triager`,
      body: "Restate in one line. Classify bug / question / request. Bugs go to the reproducer by name. Keep the open-report list in the reply.",
    });
  }
  if (agents.reproducer) {
    rules.push({
      name: `${team}-repro`,
      body: `Work in its directory. Say the command before a slow step. Post exact output. Never guess a result it did not run. Target path: ${cat.repro}.`,
    });
  }
  if (agents.release) {
    rules.push({
      name: `${team}-release`,
      body: `Page the on-call before a production change. Draft rollback / pause / flag. Wait. Confirm is the only apply. After Confirm, post the close note in this thread.`,
    });
  }
  return rules;
}

function classify(signals: LogSignals, service: Service, cat: Catalog): string {
  if (signals.empty) return "request";
  if (signals.hasPanic || signals.hasOom) return "bug";
  if (signals.statuses.some((s) => s >= 500) || signals.hasTimeout) return "bug";
  if (signals.latencies.some((n) => n >= 800)) return "bug";
  const mentionsOther = /checkout-api|auth-gateway|payments-ledger|search-index/.test(signals.excerpt);
  const mentionsThis = new RegExp(cat.api, "i").test(signals.excerpt);
  if (mentionsOther && !mentionsThis) {
    return `question (log names another service while this room is ${service})`;
  }
  return "bug";
}

function reproOutput(cat: Catalog, signals: LogSignals): string {
  if (signals.empty) {
    return `No snippet to replay. I will not invent ${cat.route} output.`;
  }
  const status = signals.statuses[0] ?? (signals.hasTimeout ? 504 : 500);
  const latency = signals.latencies[0] ?? (signals.hasTimeout ? 3000 : 800);
  const panic = signals.hasPanic ? "\npanic reproduced: nil pointer on the same frame as the snippet." : "";
  const oom = signals.hasOom ? "\nreplica-3 killed: OOM, ranking-model v19 resident." : "";
  const timeout = signals.hasTimeout ? `\nupstream deadline hit at ${latency}ms.` : "";
  return `$ curl -i ${cat.route}
HTTP ${status}  latency=${latency}ms
body matches the snippet excerpt.${panic}${oom}${timeout}`;
}

export function recompute(inputs: SandboxInputs): SandboxResult {
  const cat = CATALOG[inputs.service];
  const team = inputs.service;
  const signals = parseLog(inputs.logSnippet);
  const { total: severityScore, parts } = scoreOf(inputs, signals);
  const incidentId = `INC-${team.slice(0, 3).toUpperCase()}-${fingerprint(inputs)}`;
  const roomName = `${team}-oncall`;
  const kindGuess = classify(signals, inputs.service, cat);
  const pageHuman =
    inputs.severity === "SEV1" ||
    (inputs.severity === "SEV2" && inputs.sensitivity !== "low") ||
    (inputs.sensitivity === "high" && severityScore >= 60);

  const proposed =
    inputs.agents.release && !signals.empty
      ? buildAction(inputs, cat, signals, severityScore)
      : null;

  const dismissedThis =
    Boolean(proposed && inputs.dismissedActionId && inputs.dismissedActionId === proposed.id);

  const liveAction = dismissedThis ? null : proposed;

  const messages: Message[] = [];
  let t = 0;
  const t0 = cat.clock;

  t = pushMessage(
    messages,
    t,
    t0,
    "system",
    team,
    cat,
    `Room #${roomName} · ${incidentId} · ${inputs.severity} · score ${severityScore}`,
    "system",
  );

  const logLine = signals.empty
    ? `${cat.name} looks wrong. I do not have a log yet.`
    : `${cat.route} is failing. Snippet:\n${signals.excerpt}`;

  t = pushMessage(
    messages,
    t + 420,
    addMinutes(t0, 0),
    "human",
    team,
    cat,
    `@${team}-triager ${logLine}`,
  );

  if (inputs.agents.triager) {
    if (signals.empty) {
      t = pushMessage(
        messages,
        t + 700,
        addMinutes(t0, 1),
        "triager",
        team,
        cat,
        `Open reports\n- ${incidentId} · ${cat.route} · request · waiting on a log snippet.\n\nI will not route this as a bug. ${cat.human.name}, paste the log. ${inputs.severity} stays parked.`,
      );
    } else {
      const routeTo = inputs.agents.reproducer
        ? `@${team}-repro: ${kindGuess}. Check ${cat.repro}. I want the exact status, latency, and whether ${signals.versions[0] ?? cat.lastBad} is in the path.`
        : `${team}-repro is offline. I am holding the bug in this thread with no reproduction.`;
      t = pushMessage(
        messages,
        t + 680,
        addMinutes(t0, 1),
        "triager",
        team,
        cat,
        `Restate: ${cat.name} ${cat.route} at ${t0}, ${inputs.severity}, sensitivity ${SENS_LABEL[inputs.sensitivity]}.\nClass: ${kindGuess}. Score ${severityScore} (${parts
          .map((p) => `${p.label} ${p.points > 0 ? "+" : ""}${p.points}`)
          .join(", ")}).\n${routeTo}\n\nOpen reports\n- ${incidentId} · ${cat.route} · ${kindGuess} · ${inputs.agents.reproducer ? "with reproducer" : "reproducer offline"}`,
      );
    }
  } else {
    t = pushMessage(
      messages,
      t + 480,
      addMinutes(t0, 1),
      "system",
      team,
      cat,
      `${team}-triager is not in the room. The report sits unrouted. Enable the triager to file and route it.`,
      "system",
    );
  }

  if (inputs.agents.reproducer && !signals.empty) {
    t = pushMessage(
      messages,
      t + 820,
      addMinutes(t0, 2),
      "reproducer",
      team,
      cat,
      `I will run the smallest command that hits ${cat.route} from my directory. This may take a minute.`,
    );
    t = pushMessage(
      messages,
      t + 1100,
      addMinutes(t0, 3),
      "reproducer",
      team,
      cat,
      reproOutput(cat, signals),
      "code",
    );
    const cause = signals.hasPanic
      ? `Cause guess after the run: ${cat.api} panics on the new tax/quote path in ${signals.versions[0] ?? cat.lastBad}.`
      : signals.hasTimeout
        ? `Cause guess after the run: upstream deadline, ${Math.max(...(signals.latencies.length ? signals.latencies : [3000]))}ms, matches the snippet.`
        : signals.hasOom
          ? `Cause guess after the run: replica OOM after ${signals.versions[0] ?? cat.lastBad}.`
          : `Cause guess after the run: ${cat.api} ${signals.statuses[0] ?? 500} lines up with deploy ${signals.versions[0] ?? cat.lastBad} / ${signals.shas[0] ?? cat.shaBad}.`;
    t = pushMessage(messages, t + 640, addMinutes(t0, 4), "reproducer", team, cat, cause);
  } else if (inputs.agents.reproducer && signals.empty) {
    t = pushMessage(
      messages,
      t + 700,
      addMinutes(t0, 2),
      "reproducer",
      team,
      cat,
      "No command to run. I will not invent output. Waiting on a snippet.",
    );
  } else if (!inputs.agents.reproducer && inputs.agents.triager && !signals.empty) {
    t = pushMessage(
      messages,
      t + 500,
      addMinutes(t0, 2),
      "triager",
      team,
      cat,
      `Open reports\n- ${incidentId} · unreproduced. ${team}-repro offline. Any rollback will say so.`,
    );
  }

  if (inputs.agents.release && liveAction) {
    const evidence = inputs.agents.reproducer
      ? "Reproducer posted output in this thread."
      : "No reproduction. Proposal is log-only.";
    const pageLine = pageHuman
      ? `Paging @${cat.human.handle} before anything touches ${cat.cluster}.`
      : `${inputs.severity} at ${SENS_LABEL[inputs.sensitivity]} sensitivity does not page yet. I still wait for Confirm.`;
    t = pushMessage(
      messages,
      t + 900,
      addMinutes(t0, 6),
      "release",
      team,
      cat,
      `${pageLine}\nProposed: ${liveAction.title}.\nTarget: ${liveAction.target}.\n${evidence}\nI will not apply this. Confirm, Edit, or Dismiss.`,
      "decision",
    );
  } else if (inputs.agents.release && dismissedThis && proposed) {
    t = pushMessage(
      messages,
      t + 700,
      addMinutes(t0, 6),
      "release",
      team,
      cat,
      `I will not propose ${proposed.title} again unless the signals change. ${proposed.id} stays dismissed.`,
      "decision",
    );
  } else if (inputs.agents.release && signals.empty) {
    t = pushMessage(
      messages,
      t + 700,
      addMinutes(t0, 6),
      "release",
      team,
      cat,
      "No production action while the log is empty. I am not drafting a rollback.",
    );
  } else if (!inputs.agents.release) {
    t = pushMessage(
      messages,
      t + 520,
      addMinutes(t0, 6),
      "system",
      team,
      cat,
      `${team}-release is offline. Nobody will draft a rollback or wait on Confirm.`,
      "system",
    );
  }

  if (inputs.resolution === "confirmed" && liveAction) {
    t = pushMessage(
      messages,
      t + 640,
      addMinutes(t0, 7),
      "human",
      team,
      cat,
      `Confirm. Apply ${liveAction.title}. I am ${cat.human.name}, on-call for ${team}.`,
      "decision",
    );
    t = pushMessage(
      messages,
      t + 780,
      addMinutes(t0, 8),
      "release",
      team,
      cat,
      `Applied. ${liveAction.command}\n${incidentId} closed in #${roomName}. Next shift: detection, diagnosis, Confirm, and this note are the same thread.`,
    );
    t = pushMessage(
      messages,
      t + 420,
      addMinutes(t0, 8),
      "system",
      team,
      cat,
      `${incidentId} closed by @${cat.human.handle}.`,
      "system",
    );
  }

  if (inputs.resolution === "dismissed" && proposed) {
    t = pushMessage(
      messages,
      t + 640,
      addMinutes(t0, 7),
      "human",
      team,
      cat,
      `Dismiss ${proposed.title}. Do not apply it.`,
      "decision",
    );
    t = pushMessage(
      messages,
      t + 700,
      addMinutes(t0, 8),
      "release",
      team,
      cat,
      `Dismissed. I stop proposing ${proposed.id}. The incident stays open until the signals change or someone files a different action.`,
    );
  }

  const tasks: Task[] = [];
  tasks.push({
    id: "t-report",
    title: "File the report in the room",
    owner: "human",
    status: "done",
    note: signals.empty ? "Filed without a log." : `Filed ${cat.route}.`,
  });
  tasks.push({
    id: "t-triage",
    title: "Restate and route",
    owner: "triager",
    status: inputs.agents.triager ? (signals.empty ? "blocked" : "done") : "skipped",
    note: inputs.agents.triager
      ? signals.empty
        ? "Waiting on a snippet."
        : `${kindGuess}, score ${severityScore}.`
      : "Triager disabled.",
  });
  tasks.push({
    id: "t-repro",
    title: `Reproduce ${cat.route}`,
    owner: "reproducer",
    status: !inputs.agents.reproducer ? "skipped" : signals.empty ? "blocked" : "done",
    note: !inputs.agents.reproducer
      ? "Reproducer disabled."
      : signals.empty
        ? "No command without a log."
        : `Status ${signals.statuses[0] ?? "n/a"}, ${signals.latencies[0] ?? "n/a"}ms.`,
  });
  tasks.push({
    id: "t-page",
    title: "Page the on-call",
    owner: "release",
    status: !inputs.agents.release ? "skipped" : pageHuman ? "done" : "skipped",
    note: pageHuman
      ? `${inputs.severity} / ${SENS_LABEL[inputs.sensitivity]} pages @${cat.human.handle}.`
      : "Below page line.",
  });
  tasks.push({
    id: "t-propose",
    title: "Draft the production action",
    owner: "release",
    status: !inputs.agents.release
      ? "skipped"
      : signals.empty
        ? "blocked"
        : dismissedThis
          ? "skipped"
          : liveAction
            ? "done"
            : "blocked",
    note: liveAction ? liveAction.title : dismissedThis ? "Dismissed." : "No proposal.",
  });
  tasks.push({
    id: "t-gate",
    title: "Wait for Confirm",
    owner: "human",
    status:
      inputs.resolution === "confirmed"
        ? "done"
        : inputs.resolution === "dismissed"
          ? "skipped"
          : liveAction
            ? "running"
            : "blocked",
    note:
      inputs.resolution === "confirmed"
        ? `Confirmed by @${cat.human.handle}.`
        : inputs.resolution === "dismissed"
          ? "Dismissed; gate closed without apply."
          : liveAction
            ? "Pending a named person."
            : "Nothing to confirm.",
  });
  tasks.push({
    id: "t-close",
    title: "Close the incident in-thread",
    owner: "release",
    status: inputs.resolution === "confirmed" ? "done" : "queued",
    note: inputs.resolution === "confirmed" ? `${incidentId} closed.` : "After Confirm.",
  });

  const decisions: Decision[] = [];
  if (liveAction) {
    decisions.push({
      id: liveAction.id,
      title: liveAction.title,
      body: `${liveAction.summary} Risk: ${liveAction.risk}`,
      status:
        inputs.resolution === "confirmed"
          ? "confirmed"
          : inputs.resolution === "dismissed"
            ? "dismissed"
            : "pending",
      actor: "release",
    });
  } else if (dismissedThis && proposed) {
    decisions.push({
      id: proposed.id,
      title: proposed.title,
      body: "Dismissed. Agents stop proposing this action until the signals change.",
      status: "dismissed",
      actor: "release",
    });
  }

  if (inputs.editedAction?.trim() && liveAction) {
    decisions.push({
      id: `${liveAction.id}:edit`,
      title: "Human edit",
      body: inputs.editedAction.trim(),
      status: inputs.resolution === "confirmed" ? "confirmed" : "pending",
      actor: "human",
    });
  }

  const history: HistoryEvent[] = messages
    .filter((m) => m.actor !== "system" || m.body.includes("closed") || m.body.includes("Room"))
    .map((m, i) => ({
      id: `h${i + 1}`,
      at: m.at,
      label: m.actor === "system" ? "room" : m.handle,
      detail: m.body.split("\n")[0].slice(0, 140),
    }));

  let status: SandboxResult["status"] = "open";
  if (signals.empty && !inputs.agents.triager) status = "blocked";
  else if (inputs.resolution === "confirmed") status = "closed";
  else if (inputs.resolution === "dismissed") status = "dismissed";
  else if (liveAction) status = "pending";
  else if (signals.empty) status = "blocked";

  const summary = liveAction
    ? `${incidentId} · ${inputs.severity} · score ${severityScore} · ${liveAction.kind} of ${cat.api} waiting on Confirm.`
    : `${incidentId} · ${inputs.severity} · score ${severityScore} · no production action.`;

  return {
    incidentId,
    roomName,
    team,
    status,
    severityScore,
    scoreBreakdown: parts,
    messages,
    tasks,
    decisions,
    history,
    proposedAction: liveAction,
    members: membersFor(team, cat, inputs.agents),
    rules: rulesFor(team, cat, inputs.agents),
    summary,
    signals,
    pageHuman,
    clock: t0,
  };
}

export function defaultInputs(): SandboxInputs {
  return {
    severity: "SEV1",
    service: "checkout",
    logSnippet: `[checkout-api] 23:11:04Z POST /checkout/complete 500 812ms request_id=c8f2
[checkout-api] panic: nil pointer in TaxQuote.Apply promo=LAUNCH14
[deploy] checkout-api v2.14.0 sha=a3f91c2 rolled at 23:09:12Z by actions
[canary] error_rate 18.4% over 2m (baseline 0.3%)`,
    agents: { triager: true, reproducer: true, release: true },
    sensitivity: "high",
    resolution: "open",
  };
}

export function inputsFromPreset(
  preset: { severity: Severity; service: Service; logSnippet: string; agents: AgentFlags; sensitivity: Sensitivity },
): SandboxInputs {
  return {
    severity: preset.severity,
    service: preset.service,
    logSnippet: preset.logSnippet,
    agents: { ...preset.agents },
    sensitivity: preset.sensitivity,
    resolution: "open",
  };
}
