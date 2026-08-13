# Coquí ContextBridge Operating Agreement

## Purpose

ContextBridge is the shared context handoff for Coquí tools. It is a compact, evidence-backed ledger that lets Obvi, Codex, ChatGPT, and future tools recover the current project state without importing every workspace or conversation.

This is shared context, not a shared live brain. The bridge exists to reduce repeated explanation, token use, and context drift while keeping project decisions inspectable and human-controlled.

## Authority and transport

- **GitHub repository:** canonical durable source for product decisions, implementation, and packet history.
- **Slack `#ie-contextbridge`:** recent transport and operational ledger. Packets may be public in this channel. Slack is not the canonical source when it conflicts with GitHub.
- **Local supplemental source:** staging input only. A promoted packet is labeled `local-supplemental` and may inform a handoff, but it does not become an approved product decision by itself.

## Packet contract

Every packet must be compact, machine-readable, and source-backed. It should contain only what changed or what is required to recover state:

`v`, `project`, `packet_id`, `base_packet`, `mode`, `scope`, `generated_at`, `changed`, `manifest_sha`, `sources`, `source_changes`, `facts`, `decisions`, `open_questions`, `conflicts`, `assumptions`, and `requested_action`.

Rules:

- Never guess. If a claim is not evidenced, omit it or label it unresolved.
- Facts carry a source file, line range, and content hash when available.
- Use `checkpoint` for a first complete state, `delta` for meaningful changes, and `no_change` when nothing changed.
- Keep Slack projection under the channel payload limit. Full evidence remains in GitHub packet history.
- Do not put credentials, webhook URLs, or raw secrets in packets.

## Automation

- GitHub Actions scans on relevant pushes, hourly, and manual dispatch.
- The hosted scan posts only meaningful packets and commits durable state/history.
- The local command writes to `~/.coqui-contextbridge/staging/` and never copies raw local files into the repository.
- `--promote` copies only the sanitized packet to `contextbridge/inbox/local-latest.json`.
- `--push` is opt-in and requires an explicit operator decision.

## Review requested from Obvi

Please review whether this authority model, compact packet contract, evidence policy, and handoff cadence are sufficient for Obvi to read from and write to the bridge. Any change to the contract should be recorded here and in the repository decision log before other tools adopt it.
