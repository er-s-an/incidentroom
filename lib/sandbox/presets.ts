import type { AgentFlags, Preset, Service } from "./types";

export const ALL_AGENTS: AgentFlags = {
  triager: true,
  reproducer: true,
  release: true,
};

export const PRESETS: Preset[] = [
  {
    id: "checkout-500",
    name: "Checkout 500",
    blurb: "POST /checkout/complete 500 after v2.14.0. SEV1, high sensitivity.",
    severity: "SEV1",
    service: "checkout",
    sensitivity: "high",
    agents: ALL_AGENTS,
    logSnippet: `[checkout-api] 23:11:04Z POST /checkout/complete 500 812ms request_id=c8f2
[checkout-api] panic: nil pointer in TaxQuote.Apply promo=LAUNCH14
[deploy] checkout-api v2.14.0 sha=a3f91c2 rolled at 23:09:12Z by actions
[canary] error_rate 18.4% over 2m (baseline 0.3%)`,
  },
  {
    id: "auth-timeout",
    name: "Auth timeout",
    blurb: "OAuth token 504, session-store timed out. SEV2, medium sensitivity.",
    severity: "SEV2",
    service: "auth",
    sensitivity: "med",
    agents: ALL_AGENTS,
    logSnippet: `[auth-gateway] 22:41:11Z POST /oauth/token 504 3001ms
[auth-gateway] upstream session-store timed out after 3000ms
[deploy] auth-gateway v4.2.1 sha=e11b0c9 at 22:18:00Z
[p95] login 2400ms (SLO 400ms)`,
  },
  {
    id: "payments-latency",
    name: "Payments latency",
    blurb: "Capture p99 at 1904ms on a 10% canary. SEV2, medium sensitivity.",
    severity: "SEV2",
    service: "payments",
    sensitivity: "med",
    agents: ALL_AGENTS,
    logSnippet: `[payments-ledger] 01:02:44Z POST /capture p99=1904ms (SLO 350ms)
[payments-ledger] queue_depth 842 on capture-worker
[deploy] payments-ledger v9.8.0 sha=bb17e4d canary 10% at 00:51Z
[stripe-adapter] retries 31% on capture`,
  },
];

export const DEFAULT_PRESET = PRESETS[0];

export const SERVICE_LOGS: Record<Service, string> = {
  checkout: PRESETS[0].logSnippet,
  auth: PRESETS[1].logSnippet,
  payments: PRESETS[2].logSnippet,
  search: `[search-index] 03:18:22Z GET /search 500 640ms q_hash=9ae2
[ranking-model] replica-3 OOM after deploy v1.19.0 sha=d44aa01
[canary] error_rate 7.1% over 4m (baseline 0.4%)
[query-planner] timeout 1200ms on collection=products`,
};

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}
