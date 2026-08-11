"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRoundStore } from "@/store/round-store";
import { Wordmark, SoundOnIcon, SoundOffIcon } from "./coqui-marks";

interface AppFrameProps {
  /** Server-rendered demo banner, passed through so DEMO_MODE stays a server-only read. */
  demoBanner?: ReactNode;
  children: ReactNode;
}

/**
 * The Coquí shell: three fixed atmospheric background layers, a floating header, and the
 * workspace. The ambient glow warms once a screenshot is in hand — the frames shift from the
 * cooler upload step to the warmer brief step, so the mood tracks the same state transition.
 */
export function AppFrame({ demoBanner, children }: AppFrameProps) {
  // Sound is a header affordance in both frames but the app ships no audio yet, so the toggle
  // is a real, persisted UI state with no bound sound source — flagged for Design QA.
  const [muted, setMuted] = useState(false);
  const hasScreenshot = useRoundStore((s) => !!s.screenshotRef);

  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      <div className="app-glow" aria-hidden="true" data-mood={hasScreenshot ? "warm" : "cool"} />

      <main className="app-shell">
        <header className="app-header">
          <Wordmark />
          <div className="header-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() => setMuted((m) => !m)}
              aria-pressed={muted}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <SoundOffIcon /> : <SoundOnIcon />}
            </button>
            <a className="help-link" href="mailto:hello@coqui.design">
              Need help? Get in touch
            </a>
          </div>
        </header>

        {demoBanner}

        {children}
      </main>
    </>
  );
}

