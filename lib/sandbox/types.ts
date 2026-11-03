export type Severity = "SEV1" | "SEV2" | "SEV3";
export type Service = "checkout" | "auth" | "payments" | "search";
export type Sensitivity = "low" | "med" | "high";
export type AgentId = "triager" | "reproducer" | "release";
export type PanelTab = "history" | "rules" | "tasks" | "decisions";
export type DecisionAction = "confirm" | "edit" | "dismiss";
export type IncidentStatus = "open" | "awaiting" | "closed" | "dismissed";

export type Member = {
  id: string;
  name: string;
  role: "human" | "agent";
  agentId?: AgentId;
  status: "online" | "busy" | "away";
  initials: string;
};

export type Message = {
  id: string;
  authorId: string;
  authorName: string;
  kind: "human" | "agent" | "system";
  body: string;
  at: string;
  mentions?: string[];
};

export type TaskItem = {
  id: string;
  title: string;
  owner: string;
  status: "todo" | "doing" | "done" | "blocked";
};

export type DecisionItem = {
  id: string;
  title: string;
  proposedBy: string;
  action: string;
  status: "pending" | "confirmed" | "edited" | "dismissed";
  detail?: string;
};

export type HistoryItem = {
  id: string;
  at: string;
  label: string;
};

export type SandboxInputs = {
  severity: Severity;
  service: Service;
  logSnippet: string;
  agents: Record<AgentId, boolean>;
  sensitivity: Sensitivity;
  presetId: string;
};

export type ProposedAction = {
  id: string;
  title: string;
  command: string;
  risk: string;
  rationale: string;
};

export type SandboxState = {
  inputs: SandboxInputs;
  members: Member[];
  messages: Message[];
  tasks: TaskItem[];
  decisions: DecisionItem[];
  history: HistoryItem[];
  proposed: ProposedAction | null;
  status: IncidentStatus;
  severityScore: number;
  editedCommand: string | null;
  runId: number;
};

export type Preset = {
  id: string;
  label: string;
  seed: Omit<SandboxInputs, "presetId">;
};
