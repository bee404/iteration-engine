import { ClaudeLLMProvider } from "@/lib/providers/llm/claude-provider";
import type { Critique, PatternReference } from "@/lib/types";

/**
 * One-off manual verification (not part of `npm test`): calls the REAL Claude directions
 * provider and prints the three directions so a human can confirm they are substantively
 * distinct. Requires ANTHROPIC_API_KEY. This is the "verify via a real generation" step
 * the PR asks for; it is not a committed regression test (it costs a real API call).
 */
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");

  const critique: Critique = {
    summary:
      "The onboarding screen states its goal but buries the primary action. A user landing here has to scan three competing panels before finding where to start, and the CTA has the same visual weight as secondary links.",
    signal: [
      { kind: "signal", text: "The primary 'Get started' action competes visually with two secondary links of identical weight." },
      { kind: "signal", text: "Three panels compete for first attention; there is no clear entry point into the flow." },
      { kind: "signal", text: "Progress through the multi-step setup is not indicated anywhere on the screen." },
    ],
    preference: [{ kind: "preference", text: "The reviewer would personally prefer a darker accent color." }],
    flaggedAmbiguities: [],
    model: "test",
  };

  const patternReferences: PatternReference[] = [
    { source: "21st.dev", name: "Single-column onboarding", url: "https://21st.dev/x", description: "A focused one-column setup flow with a single dominant CTA." },
    { source: "21st.dev", name: "Progress stepper", url: "https://21st.dev/y", description: "A top-of-page step indicator for multi-step setup." },
    { source: "21st.dev", name: "Split hero with primary action", url: "https://21st.dev/z", description: "A hero layout that anchors one primary action against supporting context." },
  ];

  const provider = new ClaudeLLMProvider(apiKey);
  const { directions } = await provider.generateDirections({
    critique,
    designGoal: "Make it obvious how a new user starts the Hightouch setup on first landing.",
    feedbackText: "It's not clear where I'm supposed to click first. Everything looks the same.",
    patternReferences,
  });

  console.log(`\nReturned ${directions.length} directions:\n`);
  directions.forEach((d, i) => {
    console.log(`--- Direction ${i + 1}: ${d.title} ---`);
    console.log(`rationale:  ${d.rationale}`);
    console.log(`tradeoffs:  ${d.tradeoffs}`);
    console.log(`changes:    ${JSON.stringify(d.suggestedChanges, null, 2)}`);
    console.log(`pattern:    ${d.patternReference?.name ?? "(none)"}\n`);
  });

  const rationales = new Set(directions.map((d) => d.rationale.trim().toLowerCase()));
  const changeSets = new Set(directions.map((d) => d.suggestedChanges.join("|").toLowerCase()));
  const titles = new Set(directions.map((d) => d.title.trim().toLowerCase()));
  console.log("Distinctness check:");
  console.log(`  unique titles:      ${titles.size}/${directions.length}`);
  console.log(`  unique rationales:  ${rationales.size}/${directions.length}`);
  console.log(`  unique changesets:  ${changeSets.size}/${directions.length}`);
  if (rationales.size !== directions.length || changeSets.size !== directions.length) {
    throw new Error("FAIL: directions are not all distinct");
  }
  console.log("\nPASS: all directions are distinct.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

