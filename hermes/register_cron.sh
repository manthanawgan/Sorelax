#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SORELEX_PATH="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SORELEX_PATH}/.env"

if ! command -v hermes &>/dev/null; then
  echo "✗ hermes not found. Run: bash hermes/setup_hermes.sh"
  exit 1
fi

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

GITHUB_OWNER="${GITHUB_OWNER:-}"
GITHUB_REPO="${GITHUB_REPO:-}"

CRON_PROMPT="Run the Sorelax context refresh pipeline. Working directory: ${SORELEX_PATH}. Load .env from ${SORELEX_PATH}/.env before running scripts. Steps: (1) Use mcp_coral_sql to execute the SQL in ${SORELEX_PATH}/agent/queries/project_state.sql, substituting {owner}=${GITHUB_OWNER} and {repo}=${GITHUB_REPO}. (2) Pipe the JSON rows to: python3 ${SORELEX_PATH}/agent/summariser.py (stdin). (3) Run: python3 ${SORELEX_PATH}/agent/generate_context.py. (4) Confirm CLAUDE.md was written at ${SORELEX_PATH}/CLAUDE.md. (5) Save a Hermes memory note with timestamp and source list."

echo "==> Registering Sorelax 6h cron job..."

hermes cron create "0 */6 * * *" \
  "${CRON_PROMPT}" \
  --skill sorelex-refresh \
  --name "Sorelax 6h Context Refresh" \
  --workdir "${SORELEX_PATH}"

echo ""
echo "==> Cron jobs:"
hermes cron list

echo ""
echo "Cron job registered."
echo "  Start scheduler:  hermes gateway"
echo "  Trigger manually: hermes cron run <job_id>"
echo "  Check status:     hermes cron status"
