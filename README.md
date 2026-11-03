# IncidentRoom

On-call **incident closeout** teammates in chat, via [Switch](https://docs.switchagents.ai/switch-rooms/getting-started).

A human reports `checkout 500` → Switch room agents (**triager**, **reproducer**, **release**) route, reproduce, and propose rollback → the human **Confirm / Edit / Dismiss** → closed in the same thread.

Built for **Flip the Switch** (WeMakeDevs × Switch), Track 01 Best Business Workflow. Soft is registered. **Do not submit this repository to the contest portal unless the registrant says so.**

## Why Switch is central

Without Switch there is no shared room, no Console-started agents, and no Mattermost (or Slack/Teams) bridge for the closeout thread. The public page is an interactive **mirror** of that room so judges can poke the workflow; real agents run from Console using the YAML in [`switch/`](./switch/).

## Public demo

- Live: *(deploy URL filled after Vercel)*
- Source: https://github.com/er-s-an/incidentroom

In the sandbox you can:

1. Load a preset (Checkout 500, Auth timeout, Payments latency) — presets only **seed** controls, then the engine recomputes.
2. Change severity, service, log snippet, sensitivity, or enable/disable agent types and press **Recompute**. Messages, tasks, score, and the proposed action all change.
3. **Confirm**, **Edit**, or **Dismiss** the release proposal. State updates honestly (closed / re-queued / withdrawn).

No API keys are required for the demo.

## Run the demo locally

Node 22+ recommended.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Run the real Switch room

See [`switch/README.md`](./switch/README.md) for Console + local Mattermost (Docker) steps and [`switch/incident-closeout.template.yaml`](./switch/incident-closeout.template.yaml).

## Explainer

Timed English walkthrough for Remotion: [`docs/EXPLAINER-SCRIPT.md`](./docs/EXPLAINER-SCRIPT.md). Remotion render / review-clips upload is a follow-up after the demo ships.

## License

MIT
