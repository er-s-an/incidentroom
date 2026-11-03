"use client";

import { useState } from "react";
import type { ProposedAction, Resolution } from "@/lib/sandbox/types";

export function DecisionCard({
  action,
  resolution,
  onConfirm,
  onDismiss,
  onRepropose,
}: {
  action: ProposedAction | null;
  resolution: Resolution;
  onConfirm: () => void;
  onDismiss: () => void;
  onRepropose: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(action?.command ?? "");

  if (resolution === "confirmed") {
    return (
      <div className="decision">
        <p className="closed-note">Incident closed. The release agent posted the close note.</p>
      </div>
    );
  }

  if (resolution === "dismissed") {
    return (
      <div className="decision">
        <p className="dismissed-note">
          Dismissed. Agents stop proposing that action until the signals change.
        </p>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="decision">
        <p>No pending production action. Change severity, the log, or enable the release agent.</p>
      </div>
    );
  }

  if (editing) {
    return (
      <form
        className="edit-box"
        onSubmit={(event) => {
          event.preventDefault();
          onRepropose(draft);
          setEditing(false);
        }}
      >
        <label>
          Edit the proposed action
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Edited production action"
          />
        </label>
        <div className="decision-actions">
          <button className="btn" type="submit">
            Re-propose
          </button>
          <button
            className="btn btn-ink"
            type="button"
            onClick={() => {
              setDraft(action.command);
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="decision">
      <h3>{action.title}</h3>
      <p>{action.summary}</p>
      <p>
        Target {action.target}. {action.risk}
      </p>
      <p>Waiting on Confirm. The agent will not apply this on its own.</p>
      <div className="decision-actions">
        <button className="btn" type="button" onClick={onConfirm}>
          Confirm
        </button>
        <button
          className="btn btn-ink"
          type="button"
          onClick={() => {
            setDraft(action.command);
            setEditing(true);
          }}
        >
          Edit
        </button>
        <button className="btn btn-ink" type="button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
