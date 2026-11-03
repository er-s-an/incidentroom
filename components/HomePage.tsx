"use client";

import { useEffect, useMemo, useState } from "react";
import { Cta } from "@/components/Cta";
import { FeatureBands } from "@/components/FeatureBands";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { ProofTable } from "@/components/ProofTable";
import { SandboxRoom } from "@/components/SandboxRoom";
import { defaultInputs, recompute } from "@/lib/sandbox/engine";
import type { AgentFlags, SandboxInputs, Sensitivity } from "@/lib/sandbox/types";

export function HomePage() {
  const [inputs, setInputs] = useState<SandboxInputs>(defaultInputs);
  const result = useMemo(() => recompute(inputs), [inputs]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      for (const node of nodes) node.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.16 },
    );
    for (const node of nodes) observer.observe(node);
    const failsafe = window.setTimeout(() => {
      for (const node of nodes) node.classList.add("is-in");
    }, 2400);
    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <>
      <main className="page-main" id="content">
        <Hero />
        <HowItWorks />
        <figure className="photo-band" data-reveal="">
          <img
            src="/atmosphere/night-ops.jpg"
            alt="A greyscale night city, used here as the atmosphere of overnight on-call."
            width={2400}
            height={1400}
          />
          <figcaption>
            Overnight on-call. Photograph via Lorem Picsum (id 765), converted to greyscale.
          </figcaption>
        </figure>
        <SandboxRoom inputs={inputs} onInputs={setInputs} />
        <FeatureBands
          agents={inputs.agents}
          sensitivity={inputs.sensitivity}
          result={result}
          onAgents={(agents: AgentFlags) =>
            setInputs((prev) => ({
              ...prev,
              agents,
              resolution: "open",
              dismissedActionId: undefined,
            }))
          }
          onSensitivity={(sensitivity: Sensitivity) =>
            setInputs((prev) => ({
              ...prev,
              sensitivity,
              resolution: "open",
              dismissedActionId: undefined,
            }))
          }
        />
        <ProofTable />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
