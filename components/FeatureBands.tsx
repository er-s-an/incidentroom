"use client";

import { useState } from "react";

const BANDS = [
  {
    id: "route",
    sentence: "Route the report before anyone scrolls.",
    on: "Triager keeps open reports in every reply.",
    off: "Without routing, the thread becomes archaeology.",
    start: true,
  },
  {
    id: "repro",
    sentence: "Reproduce with output, never a guess.",
    on: "Repro agent posts the command and exact result.",
    off: "Guesses do not earn a production change.",
    start: true,
  },
  {
    id: "gate",
    sentence: "Gate every deploy behind Confirm.",
    on: "Release waits. Your name sits on the decision.",
    off: "Autonomous rollback is out of scope here.",
    start: false,
  },
  {
    id: "shift",
    sentence: "Hand the whole thread to the next shift.",
    on: "History, tasks, and decisions stay in-room.",
    off: "Handoffs die when context lives in five tools.",
    start: false,
  },
];

export default function FeatureBands() {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(BANDS.map((b) => [b.id, b.start]))
  );

  return (
    <section className="bands" aria-label="What IncidentRoom keeps">
      {BANDS.map((b) => {
        const active = on[b.id];
        return (
          <div key={b.id} className={`band ${active ? "on" : ""}`}>
            <div className="band-text">
              <p>{b.sentence}</p>
              {active ? <small>{b.on}</small> : <small>{b.off}</small>}
            </div>
            <div className="band-switch">
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={active}
                aria-label={b.sentence}
                data-ui
                onClick={() => setOn((s) => ({ ...s, [b.id]: !s[b.id] }))}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setOn((s) => ({ ...s, [b.id]: !s[b.id] }));
                  }
                }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
