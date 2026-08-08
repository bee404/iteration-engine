import { readFileSync } from "node:fs";
import { join } from "node:path";
import { postProcessGeneratedCode } from "@/lib/providers/codegen/postprocess";
import { IMPLEMENTATION_REQUIREMENTS } from "@/lib/providers/codegen/claude-provider";
import { formatDesignSystemForPrompt, getActiveDesignSystem, getColorAllowlist } from "@/lib/design-systems";

/**
 * Regression harness for the codegen design-system enforcement pipeline.
 *
 * The raw Test 1 capture ("Get started with Hightouch", direction "Make the next action
 * unmistakable") needed nine manual fixes before it honored the Vercel Geist design system.
 * This script proves those nine fixes are now handled by the pipeline instead of by hand:
 *
 *   - Deterministic fixes (fences, colors, font) are asserted on the ACTUAL post-processed
 *     output of the real raw capture — the strongest possible regression guard.
 *   - Model-driven fixes (component mapping, icons, interactivity, emphasis, numbering,
 *     responsive) are asserted by confirming the prompt now carries explicit, enforceable
 *     rules for each. Plus the emoji case is proven to be *detected* (warned) so a
 *     regression is visible rather than silent.
 *
 * Run with `npm run verify:codegen`. Exits non-zero if any check fails.
 */

const RAW_FIXTURE_PATH = join(
  process.cwd(),
  "lib",
  "providers",
  "codegen",
  "__fixtures__",
  "hightouch-onboarding.raw.txt"
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
const prompt = formatDesignSystemForPrompt(getActiveDesignSystem());
const requirements = IMPLEMENTATION_REQUIREMENTS;
const allowlist = getColorAllowlist();

// Sanity: the fixture must actually contain the problems, or the checks below are vacuous.
record(
  "fixture",
  "Raw fixture still exhibits the original problems",
  raw.trimEnd().endsWith("```") && /#f0f9ff/i.test(raw) && !/@font-face/i.test(raw),
  "Raw capture ends with a code fence, contains off-palette #f0f9ff, and has no @font-face."
);

const { code, warnings } = postProcessGeneratedCode(raw);
const warningKinds = new Set(warnings.map((w) => w.kind));

// --- Deterministic fixes: asserted on the real post-processed output ---

// #1 markdown fence stripping
record(
  "1-fence",
  "#1 Trailing markdown code fence is stripped",
  !code.includes("```") && code.includes("export default App;"),
  "Post-processed output contains no ``` fence; the component's export is intact."
);

// #2 self-hosted font loading
record(
  "2-font",
  "#2 Self-hosted Geist @font-face is injected",
  /@font-face/i.test(code) &&
    code.includes("data:font/woff2;base64,") &&
    code.includes("ie-ds-geist-font"),
  "Output now carries a base64 data-URI @font-face injected by the pipeline."
);

// #3 color allowlist enforcement
const residualHexes = [...code.matchAll(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g)]
  .map((m) => m[0].toLowerCase())
  .map((hex) => (hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex))
  .filter((hex) => !allowlist.has(hex));
record(
  "3-colors",
  "#3 All hex colors are on the design-system allowlist",
  residualHexes.length === 0,
  residualHexes.length === 0
    ? `Every hex in the output is an allowlisted token; ${warnings.filter((w) => w.kind === "off_palette_color").length} off-palette value(s) were rewritten.`
    : `Residual off-palette hexes: ${[...new Set(residualHexes)].join(", ")}`
);

// #5 icon policy — emoji are DETECTED (fix is a prompt rule; detection makes regressions visible)
record(
  "5-icons-detected",
  "#5 Emoji-as-icons are detected and warned",
  warningKinds.has("emoji_icon"),
  warningKinds.has("emoji_icon")
    ? "Post-processor flagged emoji icons in the raw capture for regeneration."
    : "No emoji warning was produced — the detector or fixture changed."
);

// --- Model-driven fixes: asserted by confirming the prompt now enforces each rule ---

function promptHas(id: string, label: string, needles: string[], haystack: string): void {
  const missing = needles.filter((n) => !haystack.toLowerCase().includes(n.toLowerCase()));
  record(id, label, missing.length === 0, missing.length === 0 ? "Rule present in prompt." : `Missing: ${missing.join(" | ")}`);
}

// #3 (prompt side) closed allowlist is advertised
promptHas("3-colors-prompt", "#3 Prompt advertises a closed color allowlist", ["CLOSED ALLOWLIST", "Allowed hex values"], prompt);
// #4 ghost-button component mapping
promptHas("4-ghost", "#4 Prompt enforces ghost-button mapping for secondary actions", ["ghost-button", "Never render a secondary action as a bare underlined text link"], requirements);
// #5 icon policy in prompt
promptHas("5-icons-prompt", "#5 Prompt bans emoji and requires inline SVG line icons", ["inline SVG line icons", "Do NOT use emoji"], requirements);
// #6 real interactivity
promptHas("6-interactivity", "#6 Prompt requires real wired state", ["wire actual React state", "useState"], requirements);
// #7 emphasis isolation
promptHas("7-emphasis", "#7 Prompt requires single-active-step emphasis isolation", ["emphasize exactly that single item", "Never apply"], requirements);
// #8 sequential numbering
promptHas("8-numbering", "#8 Prompt requires sequential step numbering", ["1-based step", "numbers"], requirements);
// #9 responsive rules
promptHas("9-responsive", "#9 Prompt requires responsive rules for narrow viewports", ["responsive rules for narrow viewports", "media quer"], requirements);

// --- Report ---

const failed = checks.filter((c) => !c.pass);
for (const c of checks) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.label}\n      ${c.detail}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);

if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) FAILED: ${failed.map((c) => c.id).join(", ")}`);
  process.exitCode = 1;
}

