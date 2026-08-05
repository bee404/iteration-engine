import { RoundWorkspace } from "@/components/round-workspace";

export default function HomePage() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Iteration Engine</h1>
        <p>Screenshot + feedback in. Critique and rationale-backed directions out. Code generation is optional, per direction.</p>
      </header>
      <RoundWorkspace />
    </main>
  );
}
