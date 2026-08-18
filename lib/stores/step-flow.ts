import { create } from "zustand";

interface StepFlowState {
  /** True when a forward step navigation is in flight, so the destination plays its enter animation. */
  pendingEnter: boolean;
  /** Arm the destination's enter-from-bottom animation. Call just before router.push. */
  armEnter: () => void;
  /** Consumed by the destination once it has read the flag. */
  consumeEnter: () => void;
}

/**
 * Coordinates the canonical step-to-step transition across the round's routes. The exiting screen
 * arms `pendingEnter` right before navigating; the arriving screen reads it once to decide whether
 * to slide its containers up from the bottom, then clears it. A hard load (flag false) skips the
 * animation and renders at rest.
 */
export const useStepFlow = create<StepFlowState>((set) => ({
  pendingEnter: false,
  armEnter: () => set({ pendingEnter: true }),
  consumeEnter: () => set({ pendingEnter: false }),
}));

