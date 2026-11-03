"use client";

import type { AgentFlags, SandboxResult, Sensitivity } from "@/lib/sandbox/types";

interface Band {
  id: "triager" | "reproducer" | "release" | "sensitivity";
  sentence: string;
  tone: "accent" | "ink";
}

const BANDS: Band[] = [
  { id: "triager", sentence: "Triager reads the report and routes it.", tone: "accent" },
  { id: "reproducer", sentence: "Reproducer runs the failing path itself.", tone: "ink" },
  { id: "release", sentence: "Release waits for a person before production.", tone: "accent" },
  { id: "sensitivity", sentence: "High sensitivity pages and rolls back sooner.", tone: "ink" },
];

export function FeatureBands({
  agents,
  sensitivity,
  result,
  onAgents,
  onSensitivity,
}: {
  agents: AgentFlags;
  sensitivity: Sensitivity;
  result: SandboxResult;
  onAgents: (next: AgentFlags) => void;
  onSensitivity: (next: Sensitivity) => void;
}) {
  const on = {
    triager: agents.triager,
    reproducer: agents.reproducer,
    release: agents.release,
    sensitivity: sensitivity === "high",
  };

  const consequence = {
    triager: agents.triager
      ? `Routes in one message. Open reports listed as ${result.incidentId}.`
      : "The report sits unrouted.",
    reproducer: agents.reproducer
      ? result.signals.empty
        ? "Online, but it will not invent output without a log."
        : `Posts exact output for ${result.roomName}.`
      : "Skipped. Any rollback is log-only.",
    release: agents.release
      ? result.proposedAction
        ? `${result.proposedAction.title}. Confirm still waits.`
        : "Online, with nothing to propose yet."
      : "Nobody drafts a rollback.",
    sensitivity:
      sensitivity === "high"
        ? `Score ${result.severityScore}. ${result.pageHuman ? "Pages now." : "Still under the page line."}`
        : `Score ${result.severityScore} at ${sensitivity} sensitivity.`,
  };

  const toggle = (id: Band["id"]) => {
    if (id === "sensitivity") {
      onSensitivity(sensitivity === "high" ? "med" : "high");
      return;
    }
    onAgents({ ...agents, [id]: !agents[id] });
  };

  return (
    <section className="bands" id="features" aria-label="What the room does">
      {BANDS.map((band) => {
        const checked = on[band.id];
        return (
          <div
            key={band.id}
            className={checked ? `band on tone-${band.tone}` : "band"}
            data-reveal=""
          >
            <div className="band-copy">
              <p>{band.sentence}</p>
              {checked ? <p className="consequence">{consequence[band.id]}</p> : null}
            </div>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={checked}
              aria-label={band.sentence}
              data-ui
              onClick={() => toggle(band.id)}
            />
          </div>
        );
      })}
    </section>
  );
}
