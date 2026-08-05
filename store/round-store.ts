import { create } from "zustand";
import type { Critique, Direction, GeneratedCode } from "@/lib/types";

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
}));
