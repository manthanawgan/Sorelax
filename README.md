# Sorelax

Sorelax is an autonomous background agent that queries **GitHub**, **Linear**, **Slack**, and **Notion** via **Coral SQL**, summarises results with the **Gemini API**, and writes a repo-root `CLAUDE.md` so AI coding tools always have up-to-date project context.

## What it does

- **Refresh pipeline**: Coral SQL → join external sources → Gemini summarisation → writes:
  - `~/.sorelax/project_context.json`
  - `~/.sorelax/project_log.jsonl`
  - `CLAUDE.md` (in the current repo)
- **On-demand Q&A**: run a narrow Coral query for a keyword derived from your question
- **Scheduler**: optional background daemon that runs refresh every 6 hours

## Requirements

- Python 3.10+
- Coral installed and on PATH (`coral`)
- Connected Coral sources: `github`, `linear`, `slack`, `notion`
- Tokens in `.env` (see `.env.example`)

## Quickstart (recommended)

Run the interactive installer:

```bash
./install.sh
```

It will:
- install the Python package editable (`pip install -e .`)
- create `~/.sorelax/`
- prompt for tokens and write `.env`
- attempt to add Coral sources
- run the first `sorelax refresh`

## Usage

```bash
sorelax refresh
sorelax ask "what changed in auth?"
sorelax status
sorelax logs
sorelax start   # daemon (refresh every 6 hours)
sorelax stop
```

## Files & layout

```
agent/   # Coral + Gemini pipeline
cli/     # Rich UI + Typer commands (installed as python package "sorelax_cli")
```

## Troubleshooting

- **Missing env var**: Sorelax will tell you exactly which one is missing (e.g. `GITHUB_OWNER`).
- **Coral returns 0 rows**: Sorelax continues, but you should run:

```bash
coral source list
```

- **Coral not found**: ensure `coral` is on PATH (or install via curl: `curl -fsSL https://withcoral.com/install.sh | sh`).
- **MCP (optional)**: Coral can run as an MCP stdio server via `coral mcp-stdio` (see `coral.md`).

