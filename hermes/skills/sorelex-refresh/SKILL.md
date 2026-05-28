---
name: sorelex-refresh
description: Refresh Sorelax project context by querying GitHub, Linear, Slack, and Notion via Coral SQL and writing CLAUDE.md
version: 1.0.0
metadata:
  hermes:
    tags: [sorelex, coral, context, automation]
    category: devops
---

# Sorelax context refresh

## When to Use

- Scheduled every 6 hours via the `Sorelax 6h Context Refresh` cron job
- On demand when `CLAUDE.md` is stale
- After major changes across GitHub, Linear, Slack, or Notion

## Procedure

1. Load `.env` from the repo root (`GITHUB_OWNER`, `GITHUB_REPO`, `GEMINI_API_KEY`).
2. Run SQL from `agent/queries/project_state.sql` via **`mcp_coral_sql`**, substituting `{owner}` and `{repo}`.
3. Pipe JSON rows to `python3 agent/summariser.py` (stdin) → writes `~/.sorelax/project_context.json`.
4. Run `python3 agent/generate_context.py` → writes `CLAUDE.md` in the working directory.
5. Save a Hermes memory note with timestamp and sources used.

## Verification

- `CLAUDE.md` exists in the repo root
- `~/.sorelax/project_context.json` has a recent `updated_at`

## refined_hints

- (Updated after successful runs.)
