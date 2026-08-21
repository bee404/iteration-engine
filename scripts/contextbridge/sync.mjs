#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function compact(value, max) {
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function parseArgs(argv) {
  const args = { config: path.join(repoRoot, "contextbridge/config.json"), root: repoRoot, state: path.join(repoRoot, "contextbridge/state.json"), latest: path.join(repoRoot, "contextbridge/latest.json"), history: path.join(repoRoot, "contextbridge/history"), scope: null, publish: false, dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") args.config = path.resolve(argv[++index]);
    else if (arg === "--root") args.root = path.resolve(argv[++index]);
    else if (arg === "--state") args.state = path.resolve(argv[++index]);
    else if (arg === "--latest") args.latest = path.resolve(argv[++index]);
    else if (arg === "--history") args.history = path.resolve(argv[++index]);
    else if (arg === "--scope") args.scope = argv[++index];
    else if (arg === "--publish") args.publish = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.promises.readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT" || error instanceof SyntaxError) return fallback; throw error; }
}

async function walk(root) {
  const output = [];
  async function visit(current) {
    let entries;
    try { entries = await fs.promises.readdir(current, { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") return; throw error; }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) output.push(absolute);
    }
  }
  await visit(root);
  return output.sort();
}

function lineEvidence(lines, start, end, max) {
  const raw = lines.slice(start, end).join("\n").trim();
  return { text: compact(raw, max), line_start: start + 1, line_end: end, truncated: raw.length > max };
}

function markdownFacts(text, source, digest, max, terms) {
  const lines = text.split(/\r?\n/);
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(#{1,4})\s+(.+?)\s*$/.exec(lines[index]);
    if (match) headings.push({ index, title: match[2] });
  }
  const facts = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (!terms.some((term) => term.test(heading.title))) continue;
    const end = headings[index + 1]?.index ?? lines.length;
    const evidence = lineEvidence(lines, heading.index, end, max);
    facts.push({ id: `${source}::${slug(heading.title)}`, source, kind: "verbatim_excerpt", heading: heading.title, text: evidence.text, evidence: { file: source, sha256: digest, line_start: evidence.line_start, line_end: evidence.line_end, truncated: evidence.truncated } });
  }
  return facts;
}

function htmlFacts(text, source, digest, max) {
  const lines = text.split(/\r?\n/);
  const facts = [];
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text);
  if (title) {
    const line = lines.findIndex((value) => value.toLowerCase().includes("<title"));
    facts.push({ id: `${source}::title`, source, kind: "verbatim_excerpt", heading: "title", text: compact(title[1], max), evidence: { file: source, sha256: digest, line_start: line + 1, line_end: line + 1, truncated: false } });
  }
  const commentLines = lines.map((line, index) => ({ line, index })).filter(({ line }) => /THESIS:|OWN-WORLD:|STORY:|FIRST VIEWPORT:|Coquí measures it once/i.test(line));
  for (const { line, index } of commentLines) {
    const match = /^\s*(THESIS|OWN-WORLD|STORY|FIRST VIEWPORT):\s*(.*?)\s*$/i.exec(line) || /^(.*Coquí measures it once.*?)$/i.exec(line.replace(/<[^>]*>/g, " "));
    if (!match) continue;
    const heading = match[1].toLowerCase().replace(/\s+/g, "_");
    facts.push({ id: `${source}::${heading}`, source, kind: "verbatim_excerpt", heading, text: compact(match[2] || match[1], max), evidence: { file: source, sha256: digest, line_start: index + 1, line_end: index + 1, truncated: false } });
  }
  return facts;
}

function jsonFacts(text, source, digest, max) {
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object") return [];
    const fields = {};
    for (const key of ["packet_id", "mode", "scope", "changed", "conflicts", "missing_sources"]) if (key in value) fields[key] = value[key];
    if (!Object.keys(fields).length) return [];
    return [{ id: `${source}::packet_meta`, source, kind: "packet_metadata", heading: "packet_meta", text: compact(JSON.stringify(fields), max), evidence: { file: source, sha256: digest, line_start: 1, line_end: 1, truncated: false } }];
  } catch { return []; }
}

function factsFor(text, source, digest, max) {
  const suffix = path.extname(source).toLowerCase();
  const terms = [/product/i, /position/i, /purpose/i, /operating/i, /principle/i, /decision/i, /blueprint/i, /status/i, /architecture/i, /roadmap/i, /open question/i, /lineage/i, /source of truth/i, /relationship/i, /non-goal/i, /current/i, /platform/i, /stack/i];
  if (suffix === ".md" || suffix === ".mdx") return markdownFacts(text, source, digest, max, terms);
  if (suffix === ".html" || suffix === ".htm") return htmlFacts(text, source, digest, max);
  if (suffix === ".json") return jsonFacts(text, source, digest, max);
  return [];
}

async function collectSources(config, root) {
  const relative = new Set((config.paths || []).map(String));
  for (const directory of config.directories || []) {
    for (const file of await walk(path.join(root, directory))) relative.add(path.relative(root, file));
  }
  const sources = [];
  const facts = [];
  const missing = [];
  for (const rel of [...relative].sort()) {
    const absolute = path.join(root, rel);
    try {
      const data = await fs.promises.readFile(absolute);
      const digest = sha256(data);
      const source = { id: rel, file: rel, sha256: digest, bytes: data.length };
      sources.push(source);
      facts.push(...factsFor(data.toString("utf8"), rel, digest, Number(config.max_excerpt_chars || 900)));
    } catch (error) {
      if (error.code === "ENOENT") missing.push(rel);
      else throw error;
    }
  }
  return { sources, facts: facts.sort((a, b) => a.id.localeCompare(b.id)), missing };
}

async function readSupplemental(root, config) {
  const packets = [];
  for (const rel of config.supplemental_packets || []) {
    const packet = await readJson(path.join(root, rel), null);
    if (packet) {
      const facts = Array.isArray(packet.facts) ? packet.facts : [...(packet.facts?.added || []), ...(packet.facts?.updated || [])];
      packets.push({ source: rel, packet_id: packet.packet_id || null, mode: packet.mode || null, changed: Boolean(packet.changed), facts, conflicts: packet.conflicts || [] });
    }
  }
  return packets;
}

function mapFacts(facts) { return new Map(facts.map((fact) => [fact.id, fact])); }

function factRef(fact, max = 360) {
  return { id: fact.id, v: compact(fact.text, max), e: { f: fact.evidence.file, l: `${fact.evidence.line_start}-${fact.evidence.line_end}`, h: fact.evidence.sha256.slice(0, 12) } };
}

function packetProjection(packet) {
  const candidates = packet.mode === "checkpoint" ? packet.facts : [...(packet.facts?.added || []), ...(packet.facts?.updated || [])];
  const selected = (candidates || []).filter((fact) => /README|PRODUCT|DESIGN|decisions|blueprint|architecture|setup\.html|packet_meta/i.test(fact.source)).slice(0, 8).map((fact) => factRef(fact));
  const supplementalFacts = (packet.supplemental || []).flatMap((item) => Array.isArray(item.facts) ? item.facts : []).slice(0, 4).map((fact) => factRef(fact, 300));
  const text = [
    "[context-packet]",
    `packet_id: ${packet.packet_id}`,
    "type: context-packet",
    "project: Coquí",
    "source: GitHub Actions ContextBridge",
    `timestamp: ${packet.generated_at}`,
    `scope: ${packet.scope}`,
    `status: ${packet.changed ? "in-progress" : "unchanged"}`,
    `summary: ${packet.mode}; changed=${String(packet.changed).toLowerCase()}; sources=${packet.stats.source_count}; facts=${packet.stats.fact_count}`,
    `facts: ${JSON.stringify(selected)}`,
    `supplemental: ${JSON.stringify({ packets: (packet.supplemental || []).map(({ source, packet_id, mode, changed, facts }) => ({ source, packet_id, mode, changed, fact_count: Array.isArray(facts) ? facts.length : 0 })), facts: supplementalFacts })}`,
    `decisions: ${JSON.stringify(packet.decisions || [])}`,
    `risks: ${JSON.stringify(packet.conflicts || [])}`,
    `open_questions: ${JSON.stringify(packet.open_questions || [])}`,
    `missing_sources: ${JSON.stringify(packet.missing_sources || [])}`,
    "assumptions: []",
    "requested_action: none",
    `manifest_sha: ${packet.manifest_sha}`,
    `history: contextbridge/history/${packet.packet_id}.json`
  ].join("\n");
  return text.length <= 4900 ? text : `${text.slice(0, 4880)}\n…`;
}

export async function runSync(options = {}) {
  const args = { ...parseArgs([]), ...options };
  const config = await readJson(args.config, null);
  if (!config) throw new Error(`Cannot read ContextBridge config: ${args.config}`);
  const scope = args.scope || config.scope || "github";
  const previous = await readJson(args.state, null);
  const collected = await collectSources(config, args.root);
  const supplemental = await readSupplemental(args.root, config);
  const previousSources = new Map((previous?.sources || []).map((source) => [source.id, source]));
  const currentSources = new Map(collected.sources.map((source) => [source.id, source]));
  const sourceChanges = {
    added: [...currentSources.keys()].filter((id) => !previousSources.has(id)),
    removed: [...previousSources.keys()].filter((id) => !currentSources.has(id)),
    updated: [...currentSources.keys()].filter((id) => previousSources.has(id) && currentSources.get(id).sha256 !== previousSources.get(id).sha256)
  };
  const previousFacts = mapFacts(previous?.facts || []);
  const currentFacts = mapFacts(collected.facts);
  const factDelta = {
    added: [...currentFacts.keys()].filter((id) => !previousFacts.has(id)).map((id) => currentFacts.get(id)),
    removed: [...previousFacts.keys()].filter((id) => !currentFacts.has(id)).map((id) => previousFacts.get(id)),
    updated: [...currentFacts.keys()].filter((id) => previousFacts.has(id) && JSON.stringify(currentFacts.get(id)) !== JSON.stringify(previousFacts.get(id))).map((id) => currentFacts.get(id))
  };
  const previousSupplemental = JSON.stringify(previous?.supplemental || []);
  const generatedDecisions = collected.facts.filter((fact) => fact.id === "docs/decisions.md::8_product_renamed_to_coqu").map((fact) => factRef(fact));
  const generatedOpenQuestions = collected.facts.filter((fact) => /open question|open questions/i.test(fact.heading)).slice(0, 6).map((fact) => factRef(fact));
  const changed = !previous || Object.values(sourceChanges).some((items) => items.length) || Object.values(factDelta).some((items) => items.length) || previousSupplemental !== JSON.stringify(supplemental) || JSON.stringify(collected.missing) !== JSON.stringify(previous?.missing_sources || []) || JSON.stringify(previous?.decisions || []) !== JSON.stringify(generatedDecisions) || JSON.stringify(previous?.open_questions || []) !== JSON.stringify(generatedOpenQuestions);
  const generatedAt = new Date().toISOString();
  const packetStamp = generatedAt.replace(/[-:.TZ]/g, "");
  const packetId = `cb_${packetStamp.slice(0, 17)}_${scope}`;
  const manifestSha = sha256(collected.sources.map((source) => `${source.id}:${source.sha256}`).join("|")).slice(0, 16);
  const decisions = generatedDecisions;
  const openQuestions = generatedOpenQuestions;
  const packet = {
    v: 1,
    project: config.project || "Coquí",
    packet_id: packetId,
    base_packet: previous?.packet_id || null,
    mode: !previous ? "checkpoint" : changed ? "delta" : "no_change",
    scope,
    generated_at: generatedAt,
    changed,
    manifest_sha: manifestSha,
    sources: collected.sources,
    source_changes: sourceChanges,
    facts: !previous ? collected.facts : factDelta,
    fact_count: collected.facts.length,
    conflicts: [],
    decisions,
    open_questions: openQuestions,
    missing_sources: collected.missing,
    supplemental,
    stats: { source_count: collected.sources.length, fact_count: collected.facts.length, added: factDelta.added.length, removed: factDelta.removed.length, updated: factDelta.updated.length }
  };
  const slack = packetProjection(packet);
  if (args.publish && changed) {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) throw new Error("--publish requires SLACK_WEBHOOK_URL");
    const response = await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: slack }) });
    if (!response.ok) throw new Error(`Slack webhook returned ${response.status}`);
  }
  if (!args.dryRun && changed) {
    await fs.promises.mkdir(path.dirname(args.state), { recursive: true });
    await fs.promises.mkdir(path.dirname(args.latest), { recursive: true });
    await fs.promises.mkdir(args.history, { recursive: true });
    await fs.promises.writeFile(args.state, `${JSON.stringify({ ...packet, facts: collected.facts }, null, 2)}\n`);
    await fs.promises.writeFile(args.latest, `${JSON.stringify(packet, null, 2)}\n`);
    await fs.promises.writeFile(path.join(args.history, `${packetId}.json`), `${JSON.stringify(packet, null, 2)}\n`);
  }
  return { packet, slack };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log("node scripts/contextbridge/sync.mjs [--scope github|local-supplemental] [--publish] [--dry-run]");
      process.exit(0);
    }
    const result = await runSync(args);
    console.log(JSON.stringify({ changed: result.packet.changed, mode: result.packet.mode, packet_id: result.packet.packet_id, stats: result.packet.stats, scope: result.packet.scope }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
