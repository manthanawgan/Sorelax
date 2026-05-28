# Sorelax × Hermes Agent

Hermes drives the Sorelax refresh pipeline on a schedule, with Coral connected as an MCP server and Hermes exposed as MCP for Claude Code.

## Layout

```
hermes/
├── skills/sorelex-refresh/SKILL.md   # Refresh procedure (loaded by cron)
├── config.yaml                       # Template → ~/.hermes/config.yaml
├── setup_hermes.sh                   # Install Hermes + copy config
├── register_cron.sh                  # 6-hour cron job
├── claude_code_mcp_config.json       # MCP servers for Claude Code
└── README.md
```

## Claude Code MCP setup

Copy `hermes/claude_code_mcp_config.json` to:

`~/.claude/claude_code_mcp_config.json`

Or merge the `mcpServers` block into your existing config. Restart Claude Code after changing MCP config.

You will get:

- **hermes** — `hermes mcp serve` (Sorelax context / refresh)
- **coral** — `coral mcp-stdio` (direct SQL across sources)

## Post-install steps

### 1. Run the main installer (if not done)

```bash
./install.sh
```

This runs `setup_hermes.sh`, `register_cron.sh`, and the first `agent/refresh.py`.

### 2. Configure Hermes LLM

```bash
hermes model
```

Choose a provider (OpenRouter, Nous Portal, etc.) or paste your API key.

### 3. Start the gateway (scheduler)

```bash
hermes gateway
```

Keep this running in the background or as a systemd/user service. The gateway executes cron jobs.

### 4. Verify the cron job

```bash
hermes cron list
```

You should see **Sorelax 6h Context Refresh** with schedule `0 */6 * * *`.

### 5. Manual test run

```bash
hermes cron run <job_id>
```

Watch for `CLAUDE.md` at the repo root and `~/.sorelax/project_context.json`.

### 6. Open Claude Code

With MCP configured, Claude Code can query Hermes and Coral directly. `CLAUDE.md` is loaded automatically when you work in this repo.

## End-to-end test (manual)

```bash
# From repo root
./install.sh                    # or: bash hermes/setup_hermes.sh && bash hermes/register_cron.sh
hermes model
hermes gateway &                # background
hermes cron list                # note job_id
hermes cron run <job_id>
test -f CLAUDE.md && head -20 CLAUDE.md
```

Alternative one-shot refresh (Python pipeline, no Hermes):

```bash
set -a && source .env && set +a
python3 agent/refresh.py
# or: sorelax refresh
```

## Flow

1. `hermes gateway` runs as a daemon
2. Every 6 hours, Hermes runs **Sorelax 6h Context Refresh**
3. Skill `sorelex-refresh` loads from `hermes/skills/`
4. Hermes calls `mcp_coral_sql` → Coral JOIN across sources
5. `agent/summariser.py` (stdin) → Gemini → `~/.sorelax/project_context.json`
6. `agent/generate_context.py` → `CLAUDE.md` in repo root

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `hermes` not found | Re-run `bash hermes/setup_hermes.sh` |
| No `mcp_coral_sql` | Check `~/.hermes/config.yaml` has `coral` under `mcp_servers`; run MCP install in setup |
| Empty Coral rows | `coral source list`; verify `.env` tokens |
| Cron does nothing | Is `hermes gateway` running? |
| Wrong GitHub data | `GITHUB_OWNER` / `GITHUB_REPO` in `.env` |
