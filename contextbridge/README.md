# Coquí ContextBridge

ContextBridge keeps the product repository authoritative while exchanging compact, evidence-backed deltas through Slack.

## Hosted path

`.github/workflows/contextbridge.yml` runs on documentation/code pushes, hourly, and manually. It scans the repository, writes a small state file and append-only packet history, and posts only meaningful changes to `#ie-contextbridge` through the `SLACK_WEBHOOK_URL` Actions secret.

GitHub is the durable record. Slack is recent transport. The workflow does not post when a scan produces no change.

## Local supplemental path

Local Dropbox work is not assumed to be canonical. Run:

```text
node scripts/contextbridge/stage-local.mjs --root "/path/to/local/Coqui"
```

This writes a sanitized packet outside the repository at `~/.coqui-contextbridge/staging/`. To promote that packet into the hosted path:

```text
node scripts/contextbridge/stage-local.mjs --root "/path/to/local/Coqui" --promote
```

`--promote` writes only `contextbridge/inbox/local-latest.json`. It does not copy raw Dropbox files. Commit and push that one packet when ready, or add `--push` if you explicitly want the script to commit and push it using your existing Git credentials.

The hosted workflow treats the promoted packet as `supplemental/local` evidence and never upgrades it to an approved decision.
