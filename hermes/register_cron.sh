#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SORELEX_PATH="$(cd "${SCRIPT_DIR}/.." && pwd)"
[[ -f "${SORELEX_PATH}/.env" ]] && set -a && source "${SORELEX_PATH}/.env" && set +a

PROMPT="Run the Sorelax context refresh. Workdir: ${SORELEX_PATH}. Load ${SORELEX_PATH}/.env. (1) mcp_coral_sql with agent/queries/project_state.sql, owner=${GITHUB_OWNER:-}, repo=${GITHUB_REPO:-}. (2) pipe rows to python3 ${SORELEX_PATH}/agent/summariser.py. (3) python3 ${SORELEX_PATH}/agent/generate_context.py. (4) Confirm CLAUDE.md at ${SORELEX_PATH}/CLAUDE.md."

hermes cron create "0 */6 * * *" "${PROMPT}" \
  --skill sorelex-refresh \
  --name "Sorelax 6h Context Refresh" \
  --workdir "${SORELEX_PATH}"

hermes cron list
