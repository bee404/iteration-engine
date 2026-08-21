#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

const requiredFiles = [
  "AGENTS.md",
  "CLAUDE.md",
  ".github/copilot-instructions.md",
  ".agents/product-marketing.md",
  "README.md",
  "PRODUCT.md",
  "DESIGN.md",
  "docs/decisions.md",
  "docs/blueprint.md",
  "docs/release-plan.md",
  "docs/design-system.md",
  "docs/knowledge-base/README.md",
  "contextbridge/config.json",
];

const platformAdapters = [
  "CLAUDE.md",
  ".github/copilot-instructions.md",
];

const contextBridgeEntrypoints = [
  "AGENTS.md",
  "CLAUDE.md",
  ".github/copilot-instructions.md",
  ".agents/product-marketing.md",
];

const errors = [];

function read(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  try {
    return fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

for (const relativePath of requiredFiles) {
  if (read(relativePath) === null) errors.push(`Missing required context file: ${relativePath}`);
}

for (const relativePath of platformAdapters) {
  const contents = read(relativePath);
  if (contents !== null && !contents.includes("AGENTS.md")) {
    errors.push(`Platform adapter must point to AGENTS.md: ${relativePath}`);
  }
}

const marketing = read(".agents/product-marketing.md");
if (marketing !== null) {
  const version = /\*\*Document version:\*\*\s*(v\d+)/.exec(marketing)?.[1];
  const changelogVersion = /## Changelog\s+\n+-\s+(v\d+)\s+\(/.exec(marketing)?.[1];
  if (!version) errors.push("Product marketing context has no document version.");
  if (!changelogVersion) errors.push("Product marketing context has no newest changelog version.");
  if (version && changelogVersion && version !== changelogVersion) {
    errors.push(`Product marketing version ${version} does not match newest changelog entry ${changelogVersion}.`);
  }
}

const configText = read("contextbridge/config.json");
if (configText !== null) {
  try {
    const config = JSON.parse(configText);
    const configuredPaths = new Set(config.paths || []);
    for (const relativePath of contextBridgeEntrypoints) {
      if (!configuredPaths.has(relativePath)) {
        errors.push(`ContextBridge does not scan required entrypoint: ${relativePath}`);
      }
    }
  } catch {
    errors.push("ContextBridge config is not valid JSON.");
  }
}

if (errors.length > 0) {
  console.error("Agent context contract failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Agent context contract passed.");
  console.log("Canonical entrypoint: AGENTS.md");
  console.log("Marketing context: .agents/product-marketing.md");
}
