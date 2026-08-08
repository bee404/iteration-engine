import { create } from "zustand";
import type { Critique, Direction, GeneratedCode } from "@/lib/types";
import { listFixtures } from "@/lib/fixtures/examples";

interface GeneratedCodeState {
  status: GeneratedCode["status"];
  code: string;
  language: string;
  error?: string;
}

interface RoundState {
  // Inputs
  screenshotRef: string | null;
  designGoal: string;
  feedbackText: string;
  reviewerContext: string;
  constraints: string;

  // Critique step
  critique: Critique | null;
  isCritiquing: boolean;
  critiqueError: string | null;

  // Directions step
  directions: Direction[];
  isGeneratingDirections: boolean;
  directionsError: string | null;
  selectedDirectionId: string | null;

  // Code-gen step, keyed by direction id — several directions can be generated independently.
  generatedCodeByDirection: Record<string, GeneratedCodeState>;

  approvalStatus: "pending" | "approved" | "rejected";

  // Index into lib/fixtures/examples' registry of the fixture the demo walkthrough is
  // currently on. Unused outside DEMO_MODE; advanceDemoRound() is the only writer.
  demoFixtureIndex: number;

  // Actions
  setScreenshotRef: (ref: string | null) => void;
  setDesignGoal: (value: string) => void;
  setFeedbackText: (value: string) => void;
  setReviewerContext: (value: string) => void;
  setConstraints: (value: string) => void;

  startCritique: () => void;
  setCritique: (critique: Critique) => void;
  setCritiqueError: (error: string) => void;

  startDirections: () => void;
  setDirections: (directions: Direction[]) => void;
  setDirectionsError: (error: string) => void;
  selectDirection: (directionId: string | null) => void;

  startCodeGen: (directionId: string, language: string) => void;
  appendCodeToken: (directionId: string, token: string) => void;
  completeCodeGen: (directionId: string) => void;
  failCodeGen: (directionId: string, error: string) => void;

  setApprovalStatus: (status: "pending" | "approved" | "rejected") => void;
  reset: () => void;

  /**
   * Demo-mode-only equivalent of reset(): advances to the next fixture in
   * lib/fixtures/examples' registry (wrapping to the first once the sequence is exhausted)
   * instead of clearing every input. Carries the uploaded screenshot forward — the fixture
   * providers ignore its content and replay captured output regardless — and pre-fills the
   * next fixture's captured designGoal/feedbackText/reviewerContext/constraints so the
   * reviewer can walk straight into "Generate critique" for that round instead of re-typing
   * intake fields demo mode never actually reads.
   */
  advanceDemoRound: () => void;
}

const initialState = {
  screenshotRef: null,
  designGoal: "",
  feedbackText: "",
  reviewerContext: "",
  constraints: "",
  critique: null,
  isCritiquing: false,
  critiqueError: null,
  directions: [],
  isGeneratingDirections: false,
  directionsError: null,
  selectedDirectionId: null,
  generatedCodeByDirection: {},
  approvalStatus: "pending" as const,
  demoFixtureIndex: 0,
};

/** Current round's working state — screenshot through generated code. Cleared on reset() after approval. */
export const useRoundStore = create<RoundState>((set) => ({
  ...initialState,

  setScreenshotRef: (ref) => set({ screenshotRef: ref }),
  setDesignGoal: (value) => set({ designGoal: value }),
  setFeedbackText: (value) => set({ feedbackText: value }),
  setReviewerContext: (value) => set({ reviewerContext: value }),
  setConstraints: (value) => set({ constraints: value }),

  startCritique: () => set({ isCritiquing: true, critiqueError: null }),
  setCritique: (critique) => set({ critique, isCritiquing: false, critiqueError: null }),
  setCritiqueError: (error) => set({ critiqueError: error, isCritiquing: false }),

  startDirections: () => set({ isGeneratingDirections: true, directionsError: null }),
  setDirections: (directions) => set({ directions, isGeneratingDirections: false, directionsError: null }),
  setDirectionsError: (error) => set({ directionsError: error, isGeneratingDirections: false }),
  selectDirection: (directionId) => set({ selectedDirectionId: directionId }),

  startCodeGen: (directionId, language) =>
    set((state) => ({
      generatedCodeByDirection: {
        ...state.generatedCodeByDirection,
        [directionId]: { status: "streaming", code: "", language },
      },
    })),
  appendCodeToken: (directionId, token) =>
    set((state) => {
      const current = state.generatedCodeByDirection[directionId];
      if (!current) return state;
      return {
        generatedCodeByDirection: {
          ...state.generatedCodeByDirection,
          [directionId]: { ...current, code: current.code + token },
        },
      };
    }),
  completeCodeGen: (directionId) =>
    set((state) => {
      const current = state.generatedCodeByDirection[directionId];
      if (!current) return state;
      return {
        generatedCodeByDirection: {
          ...state.generatedCodeByDirection,
          [directionId]: { ...current, status: "complete" },
        },
      };
    }),
  failCodeGen: (directionId, error) =>
    set((state) => {
      const current = state.generatedCodeByDirection[directionId];
      if (!current) return state;
      return {
        generatedCodeByDirection: {
          ...state.generatedCodeByDirection,
          [directionId]: { ...current, status: "error", error },
        },
      };
    }),

  setApprovalStatus: (status) => set({ approvalStatus: status }),
  reset: () => set(initialState),

  advanceDemoRound: () =>
    set((state) => {
      const fixtures = listFixtures();
      const nextIndex = fixtures.length > 0 ? (state.demoFixtureIndex + 1) % fixtures.length : 0;
      const nextFixture = fixtures[nextIndex];
      return {
        ...initialState,
        demoFixtureIndex: nextIndex,
        screenshotRef: state.screenshotRef,
        designGoal: nextFixture?.inputs.designGoal ?? initialState.designGoal,
        feedbackText: nextFixture?.inputs.feedbackText ?? initialState.feedbackText,
        reviewerContext: nextFixture?.inputs.reviewerContext ?? initialState.reviewerContext,
        constraints: nextFixture?.inputs.constraints ?? initialState.constraints,
      };
    }),
}));
