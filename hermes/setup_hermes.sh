#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SORELEX_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HERMES_HOME="${HOME}/.hermes"
HERMES_CONFIG="${HERMES_HOME}/config.yaml"
SORELEX_HOME="${HOME}/.sorelax"

echo "==> Sorelax Hermes setup (repo: ${SORELEX_ROOT})"

if ! command -v hermes &>/dev/null; then
  echo "Installing Hermes Agent..."
  curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
  # shellcheck disable=SC1090
  source ~/.bashrc 2>/dev/null || source ~/.zshrc 2>/dev/null || true
fi

if ! command -v hermes &>/dev/null; then
  echo "✗ hermes CLI not found after install. Add it to PATH and re-run."
  exit 1
fi
echo "✓ hermes $(hermes --version 2>/dev/null || echo installed)"

if [[ -d "${HERMES_HOME}/hermes-agent" ]]; then
  echo "==> Installing Hermes MCP extras..."
  (
    cd "${HERMES_HOME}/hermes-agent"
    if command -v uv &>/dev/null; then
      uv pip install -e ".[mcp]"
    else
      pip install -e ".[mcp]"
    fi
  )
else
  echo "⚠ ${HERMES_HOME}/hermes-agent not found — skip MCP extras (install may still work)"
fi

mkdir -p "${HERMES_HOME}"

if [[ -f "${HERMES_CONFIG}" ]]; then
  backup="${HERMES_CONFIG}.bak.$(date +%Y%m%d%H%M%S)"
  cp "${HERMES_CONFIG}" "${backup}"
  echo "✓ Backed up existing config to ${backup}"
fi

sed "s|__SORELEX_ROOT__|${SORELEX_ROOT}|g" "${SCRIPT_DIR}/config.yaml" > "${HERMES_CONFIG}"
echo "✓ Wrote ${HERMES_CONFIG}"

mkdir -p "${SORELEX_HOME}"
echo "✓ Created ${SORELEX_HOME}"

echo ""
echo "Next steps:"
echo "  1. hermes model          # configure your LLM provider"
echo "  2. bash hermes/register_cron.sh   # schedule the 6h refresh"
echo "  3. hermes gateway        # start the background scheduler"
