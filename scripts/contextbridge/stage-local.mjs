#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runSync } from "./sync.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const home = path.join(os.homedir(), ".coqui-contextbridge");

function args(argv) {
  const result = { root: null, promote: false, push: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") result.root = path.resolve(argv[++index]);
    else if (argv[index] === "--promote") result.promote = true;
    else if (argv[index] === "--push") result.push = true;
    else if (argv[index] === "--help") result.help = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return result;
}

const options = args(process.argv.slice(2));
if (options.help) {
  console.log('node scripts/contextbridge/stage-local.mjs --root "/path/to/local/Coqui" [--promote] [--push]');
  process.exit(0);
}
if (!options.root) throw new Error("--root is required; raw local source paths are never guessed");

const staging = path.join(home, "staging");
const result = await runSync({
  config: path.join(repoRoot, "contextbridge/local-sources.json"),
  root: options.root,
  state: path.join(home, "local-state.json"),
  latest: path.join(staging, "local-latest.json"),
  history: path.join(staging, "history"),
  scope: "local-supplemental"
});

if (options.promote) {
  const inbox = path.join(repoRoot, "contextbridge/inbox");
  await fs.promises.mkdir(inbox, { recursive: true });
  await fs.promises.copyFile(path.join(staging, "local-latest.json"), path.join(inbox, "local-latest.json"));
  if (options.push) {
    const add = spawnSync("git", ["add", "contextbridge/inbox/local-latest.json"], { cwd: repoRoot, stdio: "inherit" });
    if (add.status !== 0) process.exit(add.status || 1);
    const commit = spawnSync("git", ["commit", "-m", "chore: promote local Coquí context packet"], { cwd: repoRoot, stdio: "inherit" });
    if (commit.status !== 0) process.exit(commit.status || 1);
    const push = spawnSync("git", ["push"], { cwd: repoRoot, stdio: "inherit" });
    if (push.status !== 0) process.exit(push.status || 1);
  }
}

console.log(JSON.stringify({ changed: result.packet.changed, packet_id: result.packet.packet_id, staging: path.join(staging, "local-latest.json"), promoted: options.promote, pushed: options.push }, null, 2));
