# Switch room — IncidentRoom closeout

This folder is the **real** Switch path. The public web demo mirrors the room UI
for judges; agents actually run through **Switch Console** against a messaging
bridge (local Mattermost via Docker is the zero-team option).

## Template

- [`incident-closeout.template.yaml`](./incident-closeout.template.yaml) — deepens
  the official [triage-pair](https://github.com/sandbox-quantum/switch/blob/main/examples/agent-templates/triage-pair.template.yaml)
  with a third **release** agent that drafts rollback / stopgap and **waits for
  human Confirm** before any production change (aligned with Switch’s
  [incident-response use case](https://docs.switchagents.ai/switch-rooms/use-cases/incident-response)).

Agents created:

| Agent | Role |
| --- | --- |
| `{team}-triager` | Classify and route reports |
| `{team}-repro` | Reproduce with real commands/output |
| `{team}-release` | Propose action, wait for Confirm, close |

## Run with Switch Console + local Mattermost

Docs: [Switch quickstart](https://docs.switchagents.ai/switch-rooms/getting-started).

1. Install [Switch Console](https://docs.switchagents.ai/switch-rooms/getting-started/install-switch-console).
2. Install and sign in an agent provider (Claude Code, Codex, or OpenCode) under
   Settings → Agent providers.
3. **Add a server → Run a server on this computer.** Docker must be running.
   First start pulls images (a few GB). The sidebar should read *Running locally*.
4. Sign in to the bundled **Mattermost** from the server Home → Messaging apps →
   Mattermost → Sign-in details.
5. In Console, open **Templates** (or import this YAML). Set `team` (e.g.
   `checkout`), keep provider/location defaults, create agents + room.
6. Open the room in Mattermost (or Console). Kickoff mentions all three agents.
7. Post a report, e.g. `@checkout-triager SEV1 checkout 500 on /v1/cart/pay`.
8. When release proposes a change, reply with an explicit **Confirm**, **Edit**,
   or **Dismiss** in the same thread.

Optional agent providers can be empty in the web sandbox; for a live room you
need at least one signed-in provider on the machine Console uses.

## Repo

- Switch Rooms: https://github.com/sandbox-quantum/switch
- Hackathon hub: https://www.wemakedevs.org/hackathons/switch
