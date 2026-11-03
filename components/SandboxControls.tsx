"use client";

import { PRESETS } from "@/lib/sandbox/presets";
import type { AgentFlags, SandboxInputs, SandboxResult, Sensitivity, Service, Severity } from "@/lib/sandbox/types";

const SEVERITIES: Severity[] = ["SEV1", "SEV2", "SEV3"];
const SERVICES: Service[] = ["checkout", "auth", "payments", "search"];
const SENS: { id: Sensitivity; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "med", label: "Med" },
  { id: "high", label: "High" },
];

export function SandboxControls({
  inputs,
  result,
  playing,
  onChange,
  onPreset,
  onRun,
}: {
  inputs: SandboxInputs;
  result: SandboxResult;
  playing: boolean;
  onChange: (next: Partial<SandboxInputs>) => void;
  onPreset: (id: string) => void;
  onRun: () => void;
}) {
  const setAgent = (id: keyof AgentFlags, value: boolean) => {
    onChange({ agents: { ...inputs.agents, [id]: value } });
  };

  return (
    <div className="controls" data-ui="">
      <div className="controls-row">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-btn"
            aria-pressed={
              inputs.service === preset.service &&
              inputs.severity === preset.severity &&
              inputs.logSnippet === preset.logSnippet
            }
            onClick={() => onPreset(preset.id)}
          >
            {preset.name}
          </button>
        ))}
      </div>
      <div className="controls-grid">
        <label className="field span-3">
          <span>Severity</span>
          <div className="choice-set">
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                type="button"
                aria-pressed={inputs.severity === sev}
                onClick={() => onChange({ severity: sev })}
              >
                {sev}
              </button>
            ))}
          </div>
        </label>
        <label className="field span-3">
          <span>Service</span>
          <select
            value={inputs.service}
            onChange={(event) => onChange({ service: event.target.value as Service })}
            aria-label="Service"
          >
            {SERVICES.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
        <label className="field span-3">
          <span>Sensitivity</span>
          <div className="choice-set">
            {SENS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={inputs.sensitivity === item.id}
                onClick={() => onChange({ sensitivity: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </label>
        <div className="field span-3">
          <span>Agents in the room</span>
          <div className="choice-set">
            <button
              type="button"
              className="agent-toggle"
              aria-pressed={inputs.agents.triager}
              onClick={() => setAgent("triager", !inputs.agents.triager)}
            >
              triager
            </button>
            <button
              type="button"
              className="agent-toggle"
              aria-pressed={inputs.agents.reproducer}
              onClick={() => setAgent("reproducer", !inputs.agents.reproducer)}
            >
              reproducer
            </button>
            <button
              type="button"
              className="agent-toggle"
              aria-pressed={inputs.agents.release}
              onClick={() => setAgent("release", !inputs.agents.release)}
            >
              release
            </button>
          </div>
        </div>
        <label className="field span-12">
          <span>Log snippet</span>
          <textarea
            value={inputs.logSnippet}
            onChange={(event) => onChange({ logSnippet: event.target.value })}
            aria-label="Log snippet"
            spellCheck={false}
          />
        </label>
      </div>
      <div className="run-row">
        <p className="score-live">
          {result.severityScore}
          <small>
            {result.incidentId} · {result.status} · {result.summary}
          </small>
        </p>
        <button className="btn" type="button" onClick={onRun} disabled={playing}>
          {playing ? "Playing" : "Run / Replay"}
        </button>
      </div>
    </div>
  );
}
