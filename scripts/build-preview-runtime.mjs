// Bundles the sandboxed-preview React runtime (scripts/preview-runtime-entry.mjs) into a
// single minified classic script served from /public. Runs as an npm `prebuild` step so the
// asset is regenerated on every deploy, and the output is committed so `next dev` and tests
// have it without a manual build. See components/preview-frame.tsx for the consumer.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

await build({
  entryPoints: [resolve(here, "preview-runtime-entry.mjs")],
  outfile: resolve(root, "public/preview-runtime/react-globals.js"),
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  define: { "process.env.NODE_ENV": '"production"' },
});

console.log("Built public/preview-runtime/react-globals.js");

