import type { Preset } from "./types";

export const PRESETS: Preset[] = [
  {
    id: "checkout-500",
    label: "Checkout 500",
    seed: {
      severity: "SEV1",
      service: "checkout",
      logSnippet:
        "ERROR checkout-api POST /v1/cart/pay status=500 upstream=payments-router timeout after 3000ms trace=trc_9f2a",
      agents: { triager: true, reproducer: true, release: true },
      sensitivity: "med",
    },
  },
  {
    id: "auth-timeout",
    label: "Auth timeout",
    seed: {
      severity: "SEV2",
      service: "auth",
      logSnippet:
        "WARN auth-gateway GET /oauth/token latency_p99=4200ms circuit=open retries=3 err=upstream_deadline",
      agents: { triager: true, reproducer: true, release: true },
      sensitivity: "high",
    },
  },
  {
    id: "payments-latency",
    label: "Payments latency",
    seed: {
      severity: "SEV2",
      service: "payments",
      logSnippet:
        "ALERT payments-edge p95=1800ms p99=6400ms error_rate=2.1% region=us-east-1 window=5m",
      agents: { triager: true, reproducer: true, release: true },
      sensitivity: "med",
    },
  },
];

export const DEFAULT_INPUTS = {
  ...PRESETS[0].seed,
  presetId: PRESETS[0].id,
};
