export type Severity = "SEV1" | "SEV2" | "SEV3";
export type Service = "checkout" | "auth" | "payments" | "search";
export type Sensitivity = "low" | "med" | "high";
export type AgentId = "triager" | "reproducer" | "release";
export type ActorId = "human" | AgentId | "system";
export type Resolution = "open" | "confirmed" | "dismissed";
export type TaskStatus = "queued" | "running" | "done" | "blocked" | "skipped";
export type DecisionStatus = "pending" | "confirmed" | "dismissed" | "superseded";
export type IncidentStatus = "open" | "pending" | "closed" | "dismissed" | "blocked";

export interface AgentFlags {
  triager: boolean;
  reproducer: boolean;
  release: boolean;
}

export interface SandboxInputs {
  severity: Severity;
  service: Service;
  logSnippet: string;
  agents: AgentFlags;
  sensitivity: Sensitivity;
  resolution: Resolution;
  editedAction?: string;
  dismissedActionId?: string;
}

export interface Message {
  id: string;
  actor: ActorId;
  name: string;
  handle: string;
  body: string;
  at: string;
  kind: "chat" | "system" | "decision" | "code";
  delayMs: number;
}

export interface Task {
  id: string;
  title: string;
  owner: ActorId;
  status: TaskStatus;
  note: string;
}

export interface Decision {
  id: string;
  title: string;
  body: string;
  status: DecisionStatus;
  actor: ActorId;
}

export interface HistoryEvent {
  id: string;
  at: string;
  label: string;
  detail: string;
}

export interface ProposedAction {
  id: string;
  title: string;
  summary: string;
  target: string;
  command: string;
  waitForHuman: boolean;
  risk: string;
  kind: "rollback" | "canary-pause" | "flag" | "watch";
}

export interface Member {
  id: ActorId;
  name: string;
  handle: string;
  role: string;
  online: boolean;
  initials: string;
}

export interface Rule {
  name: string;
  body: string;
}

export interface ScorePart {
  label: string;
  points: number;
}

export interface LogSignals {
  statuses: number[];
  latencies: number[];
  shas: string[];
  versions: string[];
  hasTimeout: boolean;
  hasPanic: boolean;
  hasOom: boolean;
  errorRate: number | null;
  excerpt: string;
  empty: boolean;
}

export interface SandboxResult {
  incidentId: string;
  roomName: string;
  team: string;
  status: IncidentStatus;
  severityScore: number;
  scoreBreakdown: ScorePart[];
  messages: Message[];
  tasks: Task[];
  decisions: Decision[];
  history: HistoryEvent[];
  proposedAction: ProposedAction | null;
  members: Member[];
  rules: Rule[];
  summary: string;
  signals: LogSignals;
  pageHuman: boolean;
  clock: string;
}

export interface Preset {
  id: string;
  name: string;
  blurb: string;
  severity: Severity;
  service: Service;
  logSnippet: string;
  agents: AgentFlags;
  sensitivity: Sensitivity;
}
