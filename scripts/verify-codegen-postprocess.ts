import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getColorAllowlist, getDesignSystemById } from "@/lib/design-systems";
import { postProcessGeneratedCode } from "@/lib/providers/codegen/postprocess";
import { buildPrompt, IMPLEMENTATION_REQUIREMENTS } from "@/lib/providers/codegen/shared";
import type { CodeGenRequest } from "@/lib/providers/codegen/types";

/** Regression harness for source preservation and the optional design-system pass. */
const RAW_FIXTURE_PATH = join(
  process.cwd(),
  "lib",
  "providers",
  "codegen",
  "__fixtures__",
  "hightouch-onboarding.raw.txt",
);

interface Check {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

const checks: Check[] = [];
function record(id: string, label: string, pass: boolean, detail: string): void {
  checks.push({ id, label, pass, detail });
}

const raw = readFileSync(RAW_FIXTURE_PATH, "utf-8");
const request: CodeGenRequest = {
  direction: {
    id: "direction-1",
    title: "Make the next action unmistakable",
    rationale: "The active task needs stronger hierarchy.",
    tradeoffs: "The active task carries more visual weight.",
    suggestedChanges: ["Emphasize only the active task"],
    patternReference: null,
  },
  designGoal: "Make onboarding easier to complete.",
  feedbackText: "Make the next action clearer without redesigning the product.",
  reviewerContext: "First-time admin",
  constraints: "Keep the source theme and sidebar.",
  critique: {
    summary: "The active task lacks hierarchy.",
    signal: [{ kind: "signal", text: "The primary task is hard to distinguish." }],
    preference: [{ kind: "preference", text: "The reviewer prefers a warmer feel." }],
    flaggedAmbiguities: [],
    model: "verification-fixture",
  },
  viewport: { width: 1478, height: 1064 },
  generationMode: "preserve-source",
  screenshotRef: "data:image/png;base64,fixture",
};

const sourcePrompt = buildPrompt(request);
const requirements = IMPLEMENTATION_REQUIREMENTS;

record(
  "fixture",
  "Raw fixture still contains cleanup and palette regression cases",
  raw.trimEnd().endsWith("```") && /#f0f9ff/i.test(raw) && !/@font-face/i.test(raw),
  "Fixture ends with a code fence, contains #f0f9ff, and has no @font-face.",
);

const sourceResult = postProcessGeneratedCode(raw);
const sourceWarningKinds = new Set(sourceResult.warnings.map((warning) => warning.kind));
record(
  "source-fence",
  "Default cleanup strips markdown fences",
  !sourceResult.code.includes("```") && sourceResult.code.includes("export default App;"),
  "The component export remains intact and no fence remains.",
);
record(
  "source-colors",
  "Default cleanup preserves source colors",
  sourceResult.code.includes("#f0f9ff") && !sourceWarningKinds.has("off_palette_color"),
  "No design system was selected, so #f0f9ff remains unchanged.",
);
record(
  "source-font",
  "Default cleanup does not inject Geist",
  !sourceResult.code.includes("ie-ds-geist-font"),
  "Source-preserving mode introduces no font override.",
);
record(
  "source-icons",
  "Emoji-as-icons remain visible as a generation warning",
  sourceWarningKinds.has("emoji_icon"),
  "The source-preserving pass still detects unsupported glyph icons.",
);

function promptHas(id: string, label: string, needles: string[], haystack: string): void {
  const missing = needles.filter((needle) => !haystack.toLowerCase().includes(needle.toLowerCase()));
  record(
    id,
    label,
    missing.length === 0,
    missing.length === 0 ? "Rule present in prompt." : `Missing: ${missing.join(" | ")}`,
  );
}

promptHas(
  "source-contract",
  "Prompt makes the screenshot authoritative and protects unaffected regions",
  ["PRESERVE SOURCE", "dominant light/dark theme", "generic template", "unaffected source regions"],
  sourcePrompt,
);
promptHas(
  "full-context",
  "Prompt receives the complete round context and locked viewport",
  ["rawFeedback", "reviewerContext", "constraints", "critique", '"width": 1478', '"height": 1064'],
  sourcePrompt,
);
promptHas(
  "complete-screen",
  "Prompt requires the full visible screen instead of an isolated fragment",
  ["complete visible screen", "application shell", "Never return only the area being changed"],
  requirements,
);
promptHas(
  "copy-retention",
  "Prompt protects visible copy and unrelated content",
  ["Preserve every legible piece of visible copy", "remove unrelated content"],
  requirements,
);
promptHas(
  "viewport-contract",
  "Prompt preserves desktop geometry at the exact viewport",
  ["exact target viewport", "desktop geometry", "do not introduce responsive reflow"],
  requirements,
);
promptHas(
  "icons",
  "Prompt bans emoji and requires inline SVG icons",
  ["inline SVG line icons", "Do NOT use emoji"],
  requirements,
);
promptHas(
  "interactivity",
  "Prompt requires real wired interaction state",
  ["wire actual React state", "useState"],
  requirements,
);
promptHas(
  "emphasis",
  "Prompt isolates emphasis to the selected target",
  ["emphasize exactly that item", "Never spread its treatment"],
  requirements,
);

const designSystem = getDesignSystemById("vercel-geist");
if (!designSystem) throw new Error("The registered vercel-geist system is missing.");
const designSystemRequest: CodeGenRequest = {
  ...request,
  generationMode: "apply-design-system",
  designSystemId: designSystem.id,
};
const designSystemPrompt = buildPrompt(designSystemRequest);
const allowlist = getColorAllowlist(designSystem);
const designSystemResult = postProcessGeneratedCode(raw, { designSystem });
const designSystemWarningKinds = new Set(designSystemResult.warnings.map((warning) => warning.kind));
const residualHexes = [...designSystemResult.code.matchAll(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g)]
  .map((match) => match[0].toLowerCase())
  .map((hex) =>
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex,
  )
  .filter((hex) => !allowlist.has(hex));

record(
  "explicit-prompt",
  "Explicit design-system mode includes Vercel Geist",
  designSystemPrompt.includes("Vercel Geist"),
  "The optional system appears only after it is explicitly selected.",
);
record(
  "explicit-colors",
  "Explicit Geist mode enforces its palette",
  residualHexes.length === 0 && designSystemWarningKinds.has("off_palette_color"),
  residualHexes.length === 0
    ? "Every output hex is allowlisted and the replacement was reported."
    : `Residual off-palette hexes: ${[...new Set(residualHexes)].join(", ")}`,
);
record(
  "explicit-font",
  "Explicit Geist mode injects its self-hosted font",
  /@font-face/i.test(designSystemResult.code) && designSystemResult.code.includes("ie-ds-geist-font"),
  "The opt-in pipeline carries the base64 font-face injector.",
);

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}  ${check.label}\n      ${check.detail}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);

if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) FAILED: ${failed.map((check) => check.id).join(", ")}`);
  process.exitCode = 1;
}
