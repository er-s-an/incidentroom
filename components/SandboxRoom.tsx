"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DecisionCard } from "@/components/DecisionCard";
import { RoomMembers } from "@/components/RoomMembers";
import { RoomPanels } from "@/components/RoomPanels";
import { RoomThread } from "@/components/RoomThread";
import { SandboxControls } from "@/components/SandboxControls";
import { recompute } from "@/lib/sandbox/engine";
import { presetById } from "@/lib/sandbox/presets";
import type { SandboxInputs } from "@/lib/sandbox/types";

export function SandboxRoom({
  inputs,
  onInputs,
}: {
  inputs: SandboxInputs;
  onInputs: (next: SandboxInputs) => void;
}) {
  const result = useMemo(() => recompute(inputs), [inputs]);
  const [visible, setVisible] = useState(result.messages.length);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);

  const stop = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    setPlaying(false);
  }, []);

  const play = useCallback(
    (messages = result.messages) => {
      stop();
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || messages.length === 0) {
        setVisible(messages.length);
        return;
      }
      setPlaying(true);
      setVisible(0);
      messages.forEach((message, index) => {
        const id = window.setTimeout(() => {
          setVisible(index + 1);
          if (index + 1 === messages.length) setPlaying(false);
        }, message.delayMs);
        timers.current.push(id);
      });
    },
    [result.messages, stop],
  );

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (playing) return;
    setVisible(result.messages.length);
  }, [result.incidentId, result.messages.length, result.status, playing]);

  const patch = (next: Partial<SandboxInputs>) => {
    stop();
    onInputs({
      ...inputs,
      ...next,
      resolution: next.resolution ?? "open",
      dismissedActionId: next.dismissedActionId,
      editedAction: next.editedAction,
    });
  };

  return (
    <section className="sandbox" id="sandbox">
      <div className="sandbox-head">
        <h2>The live room</h2>
        <p>
          Change severity, the service, the log, the agents, or sensitivity. The thread, the tasks,
          and the proposed rollback recompute from those inputs. Presets only seed the controls.
        </p>
      </div>
      <p className="banner">
        Demo UI mirrors the Switch room; real agents run via Switch Console.
      </p>
      <div className="sandbox-layout">
        <SandboxControls
          inputs={inputs}
          result={result}
          playing={playing}
          onChange={(next) =>
            patch({
              ...next,
              resolution: "open",
              dismissedActionId: undefined,
              editedAction: next.logSnippet !== undefined ? undefined : inputs.editedAction,
            })
          }
          onPreset={(id) => {
            const preset = presetById(id);
            if (!preset) return;
            stop();
            onInputs({
              severity: preset.severity,
              service: preset.service,
              logSnippet: preset.logSnippet,
              agents: { ...preset.agents },
              sensitivity: preset.sensitivity,
              resolution: "open",
              editedAction: undefined,
              dismissedActionId: undefined,
            });
          }}
          onRun={() => play()}
        />
        <div className="room" data-ui="">
          <RoomMembers members={result.members} />
          <div className="thread">
            <RoomThread
              roomName={result.roomName}
              incidentId={result.incidentId}
              messages={result.messages.slice(0, visible)}
            />
            <div className="thread-foot">
              <DecisionCard
                action={result.proposedAction}
                resolution={inputs.resolution}
                onConfirm={() => patch({ resolution: "confirmed" })}
                onDismiss={() =>
                  patch({
                    resolution: "dismissed",
                    dismissedActionId: result.proposedAction?.id,
                  })
                }
                onRepropose={(text) =>
                  patch({
                    resolution: "open",
                    editedAction: text,
                    dismissedActionId: undefined,
                  })
                }
              />
            </div>
          </div>
          <RoomPanels result={result} />
        </div>
      </div>
    </section>
  );
}
