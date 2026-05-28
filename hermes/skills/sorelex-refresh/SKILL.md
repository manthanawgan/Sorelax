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
- On demand when project context (`CLAUDE.md`) is stale or missing
- After major sprint, PR, or architecture changes across GitHub, Linear, Slack, or Notion

## Prerequisites

- Working directory is the Sorelax repo root (cron sets `--workdir`)
- `.env` loaded: `GITHUB_OWNER`, `GITHUB_REPO`, `GEMINI_API_KEY`, and Coral source tokens
- Coral MCP server connected (`mcp_coral_sql` available)
- `~/.sorelax/` exists for persisted context

## Procedure

### Step 1 — Coral SQL project state

1. Read SQL from `agent/queries/project_state.sql` in the repo root.
2. Substitute placeholders:
   - `{owner}` → value of `GITHUB_OWNER`
   - `{repo}` → value of `GITHUB_REPO`
3. Execute the query with the **`mcp_coral_sql`** tool (Coral stdio MCP).
4. The SQL joins `github.commits`, `github.pulls`, `linear.issues`, `slack.messages`, and `notion.pages` in a single CTE pipeline.
5. Keep the full result set as JSON (array of row objects) for the next step.

### Step 2 — Summarise with Gemini

1. Pipe the Coral JSON rows to stdin:

   ```bash
   set -a && [ -f .env ] && . ./.env && set +a
   echo '<coral_rows_json>' | python3 agent/summariser.py
   ```

2. The script calls Gemini and writes `~/.sorelax/project_context.json`.
3. Confirm stdout is valid JSON with keys: `active_work`, `recent_commits`, `open_prs`, `sprint_goal`, `key_decisions`, `relevant_slack_threads`, `architecture_docs`.

### Step 3 — Write CLAUDE.md

1. From the repo root:

   ```bash
   python3 agent/generate_context.py
   ```

2. This reads `~/.sorelax/project_context.json` and writes `CLAUDE.md` in the current working directory (repo root).

### Step 4 — Hermes memory note

Save a note to Hermes memory:

> Sorelax refresh completed at [ISO-8601 timestamp]. Sources: GitHub, Linear, Slack, Notion. Row count: [N]. CLAUDE.md updated.

### Step 5 — Self-improvement hints

After a successful run:

1. From the Coral rows, identify the most active Linear sprint (`cycle__name` / `sprint` field with the most issues).
2. Identify the top Slack channels by message count (`channel__name`).
3. Append or update a `## refined_hints` section at the end of this skill file with:

   ```markdown
   ## refined_hints
   - Active sprint: <name>
   - Most active Slack channels: <#ch1>, <#ch2>, ...
   - Last refresh: <timestamp>
   ```

Use these hints on future runs to narrow Slack time windows or Linear filters when useful.

## Pitfalls

- **Empty Coral rows**: Check `coral source list` and tokens in `.env`; do not overwrite good context with empty summaries.
- **Wrong GitHub scope**: `GITHUB_OWNER` and `GITHUB_REPO` must match Coral `github.*` table filters.
- **Missing GEMINI_API_KEY**: Step 2 fails; fix `.env` before retrying.
- **Cron isolation**: Each run is a fresh session — do not assume prior chat context; load `.env` explicitly.
- **Do not call Coral shell commands from this file** — use `mcp_coral_sql` only.

## Verification

- `~/.sorelax/project_context.json` exists and has a recent `updated_at`
- `CLAUDE.md` exists in the repo root with sections: Active work, Recent commits, Open PRs, Sprint goal
- Hermes memory contains a completion note for this run

## refined_hints

- (Populated automatically after successful runs.)
