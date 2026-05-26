# Sorelax — Teammate Setup Guide

This doc is the fastest path to getting Sorelax running on a new machine.

## 1) Install prerequisites

- **Python 3.10+**
- **Coral** installed and available as `coral`
- Access + tokens for:
  - GitHub (token + repo owner/name)
  - Linear (API key)
  - Slack (bot token)
  - Notion (integration token)
  - Gemini (API key)

## 2) One-command setup (recommended)

From the repo root:

```bash
./install.sh
```

What it does:
- installs `sorelax` (editable)
- creates `~/.sorelax/`
- prompts you for tokens and writes `.env`
- tries to connect Coral sources (`coral source add ...`)
- runs the first `sorelax refresh`

## 3) Manual setup (if you prefer)

### Create `.env`

Copy and fill:

```bash
cp .env.example .env
```

Required keys:
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GEMINI_API_KEY`

Other keys are used by Coral sources:
- `GITHUB_TOKEN`
- `LINEAR_API_KEY`
- `SLACK_TOKEN`
- `NOTION_TOKEN`

### Install Python deps

```bash
pip install -e .
```

### Connect Coral sources

At minimum, make sure Coral sees sources:

```bash
coral source list
```

If empty, add the 4 sources (details vary by Coral version):

```bash
coral source add github
coral source add linear
coral source add slack
coral source add notion
```

## 4) Day-to-day commands

```bash
sorelax refresh
sorelax ask "what is the status of payments?"
sorelax status
sorelax logs
```

### Background refresh (optional)

```bash
sorelax start
sorelax stop
```

The daemon writes a PID to:
- `~/.sorelax/sorelax.pid`

## 5) Outputs (what to expect)

After `sorelax refresh`:
- `CLAUDE.md` appears in the repo root (auto-generated)
- memory is stored in:
  - `~/.sorelax/project_context.json`
  - `~/.sorelax/project_log.jsonl`

## 6) Common issues

- **Command `sorelax` not found**
  - Run `pip install -e .` again and ensure your Python scripts directory is on PATH.

- **Coral returns 0 rows**
  - Run `coral source list` and confirm the 4 sources are connected.

- **Coral subprocess error**
  - Run the same SQL with Coral directly to see the underlying error:
    - `coral sql "SELECT 1"`

- **Gemini JSON parsing errors**
  - Sorelax retries once with a stricter prompt; if it still fails, verify `GEMINI_API_KEY` and try again.

