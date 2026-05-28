#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SORELEX_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HERMES_HOME="${HOME}/.hermes"
HERMES_CONFIG="${HERMES_HOME}/config.yaml"

if ! command -v hermes &>/dev/null; then
  echo "Installing Hermes Agent..."
  curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
  source ~/.bashrc 2>/dev/null || source ~/.zshrc 2>/dev/null || true
fi

if [[ -d "${HERMES_HOME}/hermes-agent" ]] && command -v uv &>/dev/null; then
  (cd "${HERMES_HOME}/hermes-agent" && uv pip install -e ".[mcp]")
fi

mkdir -p "${HERMES_HOME}"
[[ -f "${HERMES_CONFIG}" ]] && cp "${HERMES_CONFIG}" "${HERMES_CONFIG}.bak.$(date +%Y%m%d%H%M%S)"
sed "s|__SORELEX_ROOT__|${SORELEX_ROOT}|g" "${SCRIPT_DIR}/config.yaml" > "${HERMES_CONFIG}"
mkdir -p "${HOME}/.sorelax"
echo "✓ Hermes config: ${HERMES_CONFIG}"
