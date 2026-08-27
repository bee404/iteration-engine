import { create } from "zustand";

import type {
  Critique,
  Direction,
  GeneratedCodeStatus,
  GenerationProvenance,
  ImageDimensions,
} from "@/lib/types";

export interface RoundImage {
  /** Processed data URL carried between steps without server-side storage. */
  dataUrl: string;
  fileName: string;
  dimensions: ImageDimensions | null;
}

export interface RoundBrief {
  goal: string;
  feedback: string;
  reviewerContext: string;
  constraints: string;
}

export interface TransitionOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface GeneratedPrototype {
  directionId: string;
  status: GeneratedCodeStatus;
  code: string;
  language: string;
  provenance: GenerationProvenance | null;
  error?: string;
  warnings?: string[];
}

interface RoundState {
  image: RoundImage | null;
  brief: RoundBrief | null;
  transitionOrigin: TransitionOrigin | null;
  critique: Critique | null;
  directions: Direction[];
  directionsSource: Critique | null;
  selectedDirectionId: string | null;
  prototype: GeneratedPrototype | null;

  beginTransition: (image: RoundImage, origin: TransitionOrigin) => void;
  clearTransition: () => void;
  setBrief: (brief: RoundBrief) => void;
  setCritique: (critique: Critique) => void;
  setDirections: (critique: Critique, directions: Direction[]) => void;
  selectDirection: (directionId: string) => void;
  startPrototype: (directionId: string, language: string) => void;
  appendPrototypeToken: (directionId: string, token: string) => void;
  finalizePrototype: (
    directionId: string,
    code: string,
    warnings: string[],
    provenance: GenerationProvenance,
  ) => void;
  completePrototype: (directionId: string) => void;
  failPrototype: (directionId: string, error: string) => void;
  reset: () => void;
}

type RoundData = Pick<
  RoundState,
  | "image"
  | "brief"
  | "transitionOrigin"
  | "critique"
  | "directions"
  | "directionsSource"
  | "selectedDirectionId"
  | "prototype"
>;

function emptyRound(): RoundData {
  return {
    image: null,
    brief: null,
    transitionOrigin: null,
    critique: null,
    directions: [],
    directionsSource: null,
    selectedDirectionId: null,
    prototype: null,
  };
}

/** One in-memory V0 exploration, from screenshot through downloadable prototype. */
export const useRoundStore = create<RoundState>((set) => ({
  ...emptyRound(),

  beginTransition: (image, transitionOrigin) =>
    set({
      image,
      transitionOrigin,
      brief: null,
      critique: null,
      directions: [],
      directionsSource: null,
      selectedDirectionId: null,
      prototype: null,
    }),
  clearTransition: () => set({ transitionOrigin: null }),
  setBrief: (brief) => set({ brief }),
  setCritique: (critique) =>
    set({
      critique,
      directions: [],
      directionsSource: null,
      selectedDirectionId: null,
      prototype: null,
    }),
  setDirections: (critique, directions) => set({ directions, directionsSource: critique }),
  selectDirection: (directionId) =>
    set((state) => ({
      selectedDirectionId: directionId,
      prototype: state.prototype?.directionId === directionId ? state.prototype : null,
    })),
  startPrototype: (directionId, language) =>
    set({ prototype: { directionId, status: "streaming", code: "", language, provenance: null } }),
  appendPrototypeToken: (directionId, token) =>
    set((state) =>
      state.prototype?.directionId === directionId
        ? { prototype: { ...state.prototype, code: state.prototype.code + token } }
        : state,
    ),
  finalizePrototype: (directionId, code, warnings, provenance) =>
    set((state) =>
      state.prototype?.directionId === directionId
        ? { prototype: { ...state.prototype, code, warnings, provenance } }
        : state,
    ),
  completePrototype: (directionId) =>
    set((state) =>
      state.prototype?.directionId === directionId
        ? { prototype: { ...state.prototype, status: "complete" } }
        : state,
    ),
  failPrototype: (directionId, error) =>
    set((state) =>
      state.prototype?.directionId === directionId
        ? { prototype: { ...state.prototype, status: "error", error } }
        : state,
    ),
  reset: () => set(emptyRound()),
}));
