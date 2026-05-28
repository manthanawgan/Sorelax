# Sorelax — Teammate Setup Guide

Fastest path to running Sorelax on a new machine.

## 1) Prerequisites

- **Python 3.10+**
- **Coral** (`coral` on PATH) — [withcoral.com](https://withcoral.com)
- **Hermes Agent** — installed by `./install.sh`
- Tokens: GitHub, Linear, Slack, Notion, Gemini

## 2) One-command setup

```bash
git clone <repo-url> sorelax && cd sorelax
./install.sh
```

Installs Python deps, writes `.env`, connects Coral sources, configures Hermes (skill + 6h cron), runs first refresh.

## 3) After install

```bash
hermes model      # LLM provider for Hermes
hermes gateway    # start scheduler (keep running)
hermes cron list  # verify "Sorelax 6h Context Refresh"
```

## 4) Day-to-day

```bash
sorelax refresh
sorelax ask "what is the status of payments?"
sorelax status
sorelax logs
hermes cron run <job_id>   # manual refresh via Hermes
```

Fallback scheduler (no Hermes): `sorelax start` / `sorelax stop`

## 5) Outputs

- `CLAUDE.md` — repo root
- `~/.sorelax/project_context.json`
- `~/.sorelax/project_log.jsonl`

## 6) Common issues

See [README.md](README.md#troubleshooting) and [hermes/README.md](hermes/README.md).
