"use client";

import { useState } from "react";
import type { SandboxResult } from "@/lib/sandbox/types";

const TABS = ["History", "Rules", "Tasks", "Decisions"] as const;
type Tab = (typeof TABS)[number];

export function RoomPanels({ result }: { result: SandboxResult }) {
  const [tab, setTab] = useState<Tab>("Tasks");

  return (
    <aside className="panels">
      <div className="tabs" role="tablist" aria-label="Room panels">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="panel-body" role="tabpanel">
        {tab === "History" && (
          <div className="panel-list">
            {result.history.map((event) => (
              <article className="hist" key={event.id}>
                <strong>
                  {event.at} · {event.label}
                </strong>
                <p>{event.detail}</p>
              </article>
            ))}
          </div>
        )}
        {tab === "Rules" && (
          <div className="panel-list">
            {result.rules.map((rule) => (
              <article className="rule" key={rule.name}>
                <strong>{rule.name}</strong>
                <p>{rule.body}</p>
              </article>
            ))}
          </div>
        )}
        {tab === "Tasks" && (
          <div className="panel-list">
            {result.tasks.map((task) => (
              <article className={`task ${task.status}`} key={task.id}>
                <strong>
                  {task.title} · {task.status}
                </strong>
                <p>
                  {task.owner} — {task.note}
                </p>
              </article>
            ))}
          </div>
        )}
        {tab === "Decisions" && (
          <div className="panel-list">
            {result.decisions.length === 0 ? (
              <p>No production decision yet. Enable release, or fill a log.</p>
            ) : (
              result.decisions.map((decision) => (
                <article key={decision.id}>
                  <strong>
                    {decision.title} · {decision.status}
                  </strong>
                  <p>{decision.body}</p>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
