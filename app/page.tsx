import { RoundWorkspace } from "@/components/round-workspace";
import { isDemoMode } from "@/lib/demo-mode";
import { getActiveFixture } from "@/lib/fixtures/examples";

/**
 * Server-rendered so it can never be missed or flicker in after hydration: isDemoMode() reads
 * DEMO_MODE directly (a client component can't see raw server env vars), so this has to render
 * from a server component. Names the exact fixture being replayed so "no live API calls, no
 * persistence" isn't just an abstract claim — the reviewer can see which captured example they're
 * walking through.
 */
function DemoModeBanner() {
  const fixture = getActiveFixture();
  return (
    <div className="demo-mode-banner" role="status">
      <span className="demo-mode-badge">Demo Mode</span>
      <span>
        Replaying captured example “{fixture.label}” — no live API calls, no persistence.
      </span>
    </div>
  );
}

export default function HomePage() {
  const demoMode = isDemoMode();
  return (
    <main className="page">
      {demoMode && <DemoModeBanner />}
      <header className="page-header">
        <h1>Iteration Engine</h1>
        <p>Screenshot + feedback in. Critique and rationale-backed directions out. Code generation is optional, per direction.</p>
      </header>
      <RoundWorkspace demoMode={demoMode} />
    </main>
  );
}
