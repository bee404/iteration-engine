"use client";

import { useCallback, useLayoutEffect, useState } from "react";

import { useStepFlow } from "@/lib/stores/step-flow";

/** Duration of the slide-up-and-out / slide-in-from-bottom step transition, in ms. */
export const STEP_TRANSITION_MS = 520;

type StepPhase = "enter" | "rest" | "exit";

export interface StepStage {
  /** Class for the animated container: `step-stage` plus the current phase modifier. */
  stageClass: string;
  /** Play the exit-up animation, then run `done` (typically router.push to the next step). */
  exit: (done: () => void) => void;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The canonical step transition, reused by every screen in the round chain. On mount it slides its
 * containers up from below the viewport (when arriving via a forward step navigation), and `exit`
 * slides them up and out before the caller navigates on. Direct loads and reduced-motion render at
 * rest with no animation. Screens apply `stageClass` to the wrapper holding their step containers.
 */
export function useStepStage(): StepStage {
  const [enterOnMount] = useState(() => useStepFlow.getState().pendingEnter);
  const [phase, setPhase] = useState<StepPhase>(enterOnMount ? "enter" : "rest");
  const consumeEnter = useStepFlow((state) => state.consumeEnter);

  useLayoutEffect(() => {
    if (!enterOnMount) return;
    consumeEnter();
    // Reduced motion: the media-query rule neutralizes .step-enter, so leave the phase as-is
    // (it renders at rest) rather than synchronously flipping state inside the effect.
    if (prefersReducedMotion()) return;
    // Paint once at the off-screen "enter" position, then flip to rest so the transition runs.
    const raf = requestAnimationFrame(() => setPhase("rest"));
    return () => cancelAnimationFrame(raf);
  }, [enterOnMount, consumeEnter]);

  const exit = useCallback((done: () => void) => {
    // Arm the next screen's enter-from-bottom so the pair reads as one continuous motion.
    useStepFlow.getState().armEnter();
    if (prefersReducedMotion()) {
      done();
      return;
    }
    setPhase("exit");
    window.setTimeout(done, STEP_TRANSITION_MS);
  }, []);

  return { stageClass: `step-stage step-${phase}`, exit };
}

