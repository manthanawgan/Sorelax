# Sorelax

Sorelax is an autonomous background agent that queries **GitHub**, **Linear**, **Slack**, and **Notion** via **Coral SQL**, summarises results with the **Gemini API**, and writes a repo-root `CLAUDE.md` so AI coding tools always have up-to-date project context.

**[Documentation](website/)** · **[Hermes setup](hermes/README.md)**

## What it does

- **Refresh pipeline**: Coral SQL → cross-source JOIN → Gemini summarisation → writes:
  - `~/.sorelax/project_context.json`
  - `~/.sorelax/project_log.jsonl`
  - `CLAUDE.md` (in the repo you run refresh from)
- **On-demand Q&A**: narrow Coral query for a keyword from your question (`sorelax ask`)
- **Scheduled refresh**: [Hermes Agent](https://github.com/NousResearch/hermes-agent) cron every 6 hours (recommended), or `sorelax start` (local APScheduler fallback)
- **MCP**: Coral and Hermes exposed to Claude Code for on-demand SQL and context queries

## Architecture

```
┌─────────────────┐     every 6h      ┌──────────────────┐
│  hermes gateway │ ────────────────► │ sorelex-refresh  │
│  (cron daemon)  │                   │ skill (SKILL.md) │
└────────┬────────┘                   └────────┬─────────┘
         │                                    │
         │                          mcp_coral_sql
         ▼                                    ▼
┌─────────────────┐                   ┌──────────────────┐
│  Coral (stdio)  │ ◄── SQL JOIN ──── │ agent/ pipeline  │
│  github, linear │                   │ summariser → md  │
│  slack, notion  │                   └──────────────────┘
└─────────────────┘
```

## Requirements

- **Python 3.10+**
- **Coral** on PATH ([install](https://withcoral.com))
- **Hermes Agent** (installed by `./install.sh` or [manually](https://github.com/NousResearch/hermes-agent))
- Coral sources connected: `github`, `linear`, `slack`, `notion`
- Tokens in repo-root `.env` (see [.env.example](.env.example))

## Quickstart

Clone the repo and run the installer:

```bash
git clone https://github.com/your-org/sorelax.git
cd sorelax
./install.sh
```

The installer will:

1. Install the Python package (`pip install -e .`)
2. Create `~/.sorelax/`
3. Prompt for API tokens and write `.env`
4. Add Coral sources
5. Set up Hermes (config, skill, 6h cron job)
6. Optionally write Claude Code MCP config (`~/.claude/claude_code_mcp_config.json`)
7. Run the first context refresh

### After install

```bash
hermes model      # configure your LLM provider for Hermes
hermes gateway    # start the scheduler (keep running)
hermes cron list  # verify "Sorelax 6h Context Refresh"
```

## Usage

### Sorelax CLI

```bash
sorelax refresh              # run pipeline now
sorelax ask "what changed in auth?"
sorelax status
sorelax logs
```

### Hermes scheduler (recommended)

```bash
hermes gateway               # background daemon for cron jobs
hermes cron run <job_id>     # manual refresh
hermes cron pause <job_id>
hermes cron resume <job_id>
```

### Local scheduler (fallback)

```bash
sorelax start   # APScheduler daemon, refresh every 6h
sorelax stop
```

### One-shot Python (no Hermes)

```bash
set -a && source .env && set +a
python3 agent/refresh.py
```

## Project layout

```
agent/
  refresh.py              # full pipeline orchestrator
  summariser.py           # Gemini → project_context.json
  generate_context.py     # writes CLAUDE.md
  coral_client.py         # coral sql subprocess
  queries/project_state.sql
cli/                      # sorelax Typer CLI (package: sorelax_cli)
hermes/
  skills/sorelex-refresh/ # Hermes SKILL.md for cron jobs
  config.yaml             # template → ~/.hermes/config.yaml
  setup_hermes.sh
  register_cron.sh
  claude_code_mcp_config.json
install.sh
```

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GITHUB_OWNER` | yes | GitHub org/user for Coral `github.*` tables |
| `GITHUB_REPO` | yes | Repository name |
| `GEMINI_API_KEY` | yes | Summarisation |
| `GITHUB_TOKEN` | for Coral | GitHub source |
| `LINEAR_API_KEY` | for Coral | Linear source |
| `SLACK_TOKEN` | for Coral | Slack source (`xoxb-…`) |
| `NOTION_TOKEN` | for Coral | Notion source |

## MCP (Claude Code / Cursor)

**Coral** — direct SQL across sources:

```json
{ "command": "coral", "args": ["mcp-stdio"] }
```

**Hermes** — Sorelax context agent:

```json
{ "command": "hermes", "args": ["mcp", "serve"] }
```

Copy [hermes/claude_code_mcp_config.json](hermes/claude_code_mcp_config.json) to `~/.claude/claude_code_mcp_config.json` or merge into your existing MCP config. See [hermes/README.md](hermes/README.md) and [coral.md](coral.md).

## Changing the refresh interval

Re-create the Hermes cron job with a new schedule:

```bash
hermes cron list                    # note job id, remove if needed
hermes cron create "0 */2 * * *" "…" --skill sorelex-refresh --name "Sorelax 2h refresh" --workdir "$(pwd)"
```

Or change `INTERVAL_HOURS` in `cli/scheduler.py` if using `sorelax start`.

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Missing env var | Check `.env` in repo root; need `GITHUB_OWNER`, `GITHUB_REPO`, `GEMINI_API_KEY` |
| Coral returns 0 rows | `coral source list` — reconnect sources |
| `coral` not found | `curl -fsSL https://withcoral.com/install.sh \| sh` |
| Cron never runs | Is `hermes gateway` running? `hermes cron list` |
| `hermes` not found | `bash hermes/setup_hermes.sh` |
| Gemini JSON errors | Verify `GEMINI_API_KEY`; Sorelax retries once automatically |

## License

MIT
