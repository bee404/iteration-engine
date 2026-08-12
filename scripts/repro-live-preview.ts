/**
 * Repro harness for the live-preview render fallback Bryan is still seeing after PR #13.
 *
 * Drives the REAL ClaudeCodeGenProvider (not mock, not DEMO_MODE) through the exact
 * server->client chain that /api/generate + PreviewFrame run:
 *   1. provider.streamCode(...) accumulated token-by-token (same as app/api/generate/route.ts)
 *   2. postProcessGeneratedCode(raw)          (server stage)
 *   3. transpilePreviewComponent(code)        (client repair stage, lib/preview)
 *
 * It loops across the captured directions repeatedly until it catches a transpile failure
 * (the "Couldn't render this as live UI" fallback) and, when it does, writes the EXACT raw
 * TSX Claude returned plus the post-processed source to disk for inspection.
 *
 * Run: ANTHROPIC_API_KEY=... tsx scripts/repro-live-preview.ts <screenshotPngPath> [rounds]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ClaudeCodeGenProvider } from "@/lib/providers/codegen/claude-provider";
import { postProcessGeneratedCode } from "@/lib/providers/codegen/postprocess";
import { transpilePreviewComponent } from "@/lib/preview/build-preview-document";
import { getActiveFixture } from "@/lib/fixtures/examples";

const screenshotPath = process.argv[2];
const rounds = Number(process.argv[3] ?? "12");
if (!screenshotPath) {
  console.error("usage: tsx scripts/repro-live-preview.ts <screenshotPngPath> [rounds]");
  process.exit(1);
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is required (real provider, not mock).");
  process.exit(1);
}

const pngBase64 = readFileSync(screenshotPath).toString("base64");
const screenshotRef = `data:image/png;base64,${pngBase64}`;

const fixture = getActiveFixture();
const designGoal = fixture.inputs.designGoal;
const directions = fixture.directions.map((d) => d.direction);

const outDir = join(process.cwd(), ".repro");
mkdirSync(outDir, { recursive: true });

const provider = new ClaudeCodeGenProvider(apiKey);

async function runOne(index: number, direction: (typeof directions)[number]) {
  let raw = "";
  for await (const token of provider.streamCode({ direction, designGoal, screenshotRef })) {
    raw += token;
  }
  const { code } = postProcessGeneratedCode(raw);
  const result = transpilePreviewComponent(code);

  const rawPath = `${outDir}/round-${index}-${direction.id}.raw.txt`;
  const postPath = `${outDir}/round-${index}-${direction.id}.postprocessed.txt`;
  writeFileSync(rawPath, raw);
  writeFileSync(postPath, code);

  const status = result.ok ? "MOUNT_OK" : `FALLBACK: ${result.error}`;
  console.log(`round ${index} [${direction.id}] rawLen=${raw.length} postLen=${code.length} -> ${status}`);
  return { ok: result.ok, error: result.ok ? "" : result.error, rawPath, postPath, rawLen: raw.length };
}

(async () => {
  let failures = 0;
  for (let i = 0; i < rounds; i += 1) {
    const direction = directions[i % directions.length]!;
    try {
      const r = await runOne(i, direction);
      if (!r.ok) {
        failures += 1;
        console.log(`  >> captured failing sample at ${r.rawPath}`);
        console.log(`  >> post-processed still-failing at ${r.postPath}`);
      }
    } catch (err) {
      console.log(`round ${i} [${direction.id}] THREW: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`\nDONE. ${failures}/${rounds} rounds fell back to read-only source.`);
})();

