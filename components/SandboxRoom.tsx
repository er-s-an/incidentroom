"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyDecision,
  initialState,
  recompute,
} from "@/lib/sandbox/engine";
import { PRESETS } from "@/lib/sandbox/presets";
import type {
  AgentId,
  PanelTab,
  SandboxInputs,
  SandboxState,
  Sensitivity,
  Service,
  Severity,
} from "@/lib/sandbox/types";

function formatBody(body: string) {
  const parts = body.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="cmd">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function SandboxRoom() {
  const [state, setState] = useState<SandboxState>(() => initialState());
  const [tab, setTab] = useState<PanelTab>("tasks");
  const [visibleCount, setVisibleCount] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const inputs = state.inputs;

  useEffect(() => {
    setVisibleCount(1);
    const total = state.messages.length;
    if (total <= 1) return;
    let i = 1;
    const id = window.setInterval(() => {
      i += 1;
      setVisibleCount(i);
      if (i >= total) window.clearInterval(id);
    }, 380);
    return () => window.clearInterval(id);
  }, [state.runId, state.messages.length]);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleCount, state.status]);

  function setInputs(next: SandboxInputs) {
    setEditMode(false);
    setState(recompute(next, state.runId + 1));
  }

  function patch<K extends keyof SandboxInputs>(key: K, value: SandboxInputs[K]) {
    setInputs({ ...inputs, [key]: value, presetId: "custom" });
  }

  function toggleAgent(id: AgentId) {
    setInputs({
      ...inputs,
      agents: { ...inputs.agents, [id]: !inputs.agents[id] },
      presetId: "custom",
    });
  }

  function loadPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setInputs({ ...preset.seed, presetId: preset.id });
  }

  function onConfirm() {
    setEditMode(false);
    setState(applyDecision(state, "confirm"));
    setTab("decisions");
  }

  function onDismiss() {
    setEditMode(false);
    setState(applyDecision(state, "dismiss"));
    setTab("history");
  }

  function onEdit() {
    setEditDraft(state.proposed?.command ?? "");
    setEditMode(true);
  }

  function submitEdit() {
    setState(applyDecision(state, "edit", editDraft.trim() || state.proposed?.command));
    setEditMode(false);
    setTab("decisions");
  }

  const shown = useMemo(
    () => state.messages.slice(0, visibleCount),
    [state.messages, visibleCount]
  );

  const pending = state.proposed && state.status === "awaiting";

  return (
    <section className="sandbox-wrap" id="sandbox">
      <div className="sandbox-head">
        <h2>Close it in the room</h2>
        <p className="banner">
          Demo UI mirrors the Switch room. Real agents run via Switch Console
          and local Mattermost — see <code>switch/</code> in the repo. Changing
          severity, service, log, agents, or sensitivity recomputes this pass.
        </p>
      </div>

      <div className="room" data-ui>
        <div className="room-controls">
          <div className="ctrl">
            <label htmlFor="preset">Preset</label>
            <select
              id="preset"
              value={inputs.presetId}
              onChange={(e) => loadPreset(e.target.value)}
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="ctrl">
            <label htmlFor="sev">Severity</label>
            <select
              id="sev"
              value={inputs.severity}
              onChange={(e) => patch("severity", e.target.value as Severity)}
            >
              <option value="SEV1">SEV1</option>
              <option value="SEV2">SEV2</option>
              <option value="SEV3">SEV3</option>
            </select>
          </div>
          <div className="ctrl">
            <label htmlFor="svc">Service</label>
            <select
              id="svc"
              value={inputs.service}
              onChange={(e) => patch("service", e.target.value as Service)}
            >
              <option value="checkout">checkout</option>
              <option value="auth">auth</option>
              <option value="payments">payments</option>
              <option value="search">search</option>
            </select>
          </div>
          <div className="ctrl">
            <label htmlFor="sens">Sensitivity</label>
            <select
              id="sens"
              value={inputs.sensitivity}
              onChange={(e) =>
                patch("sensitivity", e.target.value as Sensitivity)
              }
            >
              <option value="low">low</option>
              <option value="med">med</option>
              <option value="high">high</option>
            </select>
          </div>
          <div className="ctrl" style={{ flex: "1 1 280px" }}>
            <label htmlFor="log">Log snippet</label>
            <textarea
              id="log"
              value={inputs.logSnippet}
              onChange={(e) => patch("logSnippet", e.target.value)}
            />
          </div>
          <div className="ctrl">
            <span>Agents</span>
            <div className="agent-toggles">
              {(["triager", "reproducer", "release"] as AgentId[]).map((id) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={inputs.agents[id]}
                    onChange={() => toggleAgent(id)}
                  />
                  {id}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn-room"
            onClick={() => setInputs({ ...inputs })}
          >
            Recompute
          </button>
          <span className="status-pill">
            score {state.severityScore} · {state.status} · run {state.runId}
          </span>
        </div>

        <aside className="members" aria-label="Room members">
          <h3>Members</h3>
          {state.members.map((m) => (
            <div className="member" key={m.id}>
              <div className={`avatar ${m.role}`}>{m.initials}</div>
              <div>
                <strong>{m.name}</strong>
                <span>
                  <i className={`dot ${m.status}`} />
                  {m.role === "agent" ? "agent" : "human"} · {m.status}
                </span>
              </div>
            </div>
          ))}
        </aside>

        <div className="thread">
          <div className="thread-scroll" ref={threadRef}>
            {shown.map((msg) => (
              <article key={msg.id} className={`msg ${msg.kind}`}>
                <div className="msg-meta">
                  <strong>{msg.authorName}</strong>
                  <span>{msg.at}</span>
                  {msg.kind === "agent" ? <span>agent</span> : null}
                </div>
                <div className="msg-body">{formatBody(msg.body)}</div>
              </article>
            ))}
          </div>

          {pending ? (
            <div className="decision-dock">
              <div className="decision-card">
                <h4>{state.proposed?.title}</h4>
                <p>{state.proposed?.risk}</p>
                <p>
                  <code className="cmd">{state.proposed?.command}</code>
                </p>
                {editMode ? (
                  <>
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      aria-label="Edit proposed command"
                    />
                    <div className="decision-actions">
                      <button type="button" className="btn-room" onClick={submitEdit}>
                        Save edit
                      </button>
                      <button
                        type="button"
                        className="btn-room secondary"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="decision-actions">
                    <button type="button" className="btn-room" onClick={onConfirm}>
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn-room secondary"
                      onClick={onEdit}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-room danger"
                      onClick={onDismiss}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {state.status === "closed" || state.status === "dismissed" ? (
            <div className="decision-dock">
              <div className="decision-card">
                <h4>
                  {state.status === "closed"
                    ? "Incident closed"
                    : "Proposal dismissed"}
                </h4>
                <p>Change inputs or press Recompute for another pass.</p>
                <button
                  type="button"
                  className="btn-room"
                  onClick={() => setInputs({ ...inputs })}
                >
                  New pass
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="panels" aria-label="Room panels">
          <div className="panel-tabs" role="tablist">
            {(
              [
                ["history", "History"],
                ["rules", "Rules"],
                ["tasks", "Tasks"],
                ["decisions", "Decisions"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="panel-body" role="tabpanel">
            {tab === "history" ? (
              <ul>
                {state.history.map((h) => (
                  <li key={h.id}>
                    <span className="tag">{h.at}</span>
                    {h.label}
                  </li>
                ))}
              </ul>
            ) : null}
            {tab === "rules" ? (
              <ul>
                <li>Production changes wait for human Confirm.</li>
                <li>Agents only answer when @mentioned or addressed by policy.</li>
                <li>Sensitivity changes which proposals appear — not a skin.</li>
                <li>Disabled agent types leave the room and the pass.</li>
                <li>Switch Console runs real agents; this page is a mirror.</li>
              </ul>
            ) : null}
            {tab === "tasks" ? (
              <ul>
                {state.tasks.map((t) => (
                  <li key={t.id}>
                    <span className="tag">{t.status}</span>
                    <strong>{t.title}</strong>
                    <span>{t.owner}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {tab === "decisions" ? (
              <ul>
                {state.decisions.length === 0 ? (
                  <li>No decisions yet. Enable release or raise severity.</li>
                ) : (
                  state.decisions.map((d) => (
                    <li key={d.id}>
                      <span className={`tag ${d.status}`}>{d.status}</span>
                      <strong>{d.title}</strong>
                      <span>{d.action}</span>
                      <span>{d.detail}</span>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
