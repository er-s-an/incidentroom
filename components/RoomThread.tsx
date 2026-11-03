"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/sandbox/types";

export function RoomThread({
  roomName,
  incidentId,
  messages,
}: {
  roomName: string;
  incidentId: string;
  messages: Message[];
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, messages[messages.length - 1]?.id]);

  return (
    <section className="thread" aria-label={`#${roomName} thread`}>
      <div className="thread-head">
        <h3>#{roomName}</h3>
        <span>{incidentId}</span>
      </div>
      <div className="thread-log" ref={scroller} role="log" aria-live="polite">
        {messages.length === 0 ? (
          <p className="muted">Press Run to play the closeout into this thread.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={`msg ${message.actor} ${message.kind}`}>
              <div className="msg-meta">
                <strong>{message.name}</strong>
                <span>{message.at}</span>
              </div>
              {message.kind === "code" ? (
                <pre>
                  <code>{message.body}</code>
                </pre>
              ) : (
                <p className="msg-body">{message.body}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
