#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
SORELEX_HOME="${HOME}/.sorelax"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║              SORELAX — Installation                      ║"
echo "╚══════════════════════════════════════════════════════════╝"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "✗ Missing: $1"
    return 1
  fi
  echo "✓ $1"
}

echo ""
echo "Checking dependencies..."
MISSING=0
need_cmd brew || MISSING=1
need_cmd pip || MISSING=1
need_cmd coral || {
  echo "  Install Coral: brew install coral (see https://withcoral.com)"
  MISSING=1
}

if [[ "${MISSING}" -eq 1 ]]; then
  echo ""
  echo "Install missing tools and re-run install.sh"
  exit 1
fi

echo ""
echo "Installing Python package..."
pip install -e "${REPO_ROOT}"

mkdir -p "${SORELEX_HOME}"
echo "✓ Created ${SORELEX_HOME}"

echo ""
echo "Configure tokens (saved to .env):"
read -rp "GitHub token (ghp_...): " GITHUB_TOKEN
read -rp "GitHub owner (org/user): " GITHUB_OWNER
read -rp "GitHub repo name: " GITHUB_REPO
read -rp "Linear API key: " LINEAR_API_KEY
read -rp "Slack bot token (xoxb-...): " SLACK_TOKEN
read -rp "Notion integration token: " NOTION_TOKEN
read -rp "Gemini API key: " GEMINI_API_KEY

cat > "${ENV_FILE}" <<EOF
GITHUB_OWNER=${GITHUB_OWNER}
GITHUB_REPO=${GITHUB_REPO}
GITHUB_TOKEN=${GITHUB_TOKEN}
LINEAR_API_KEY=${LINEAR_API_KEY}
SLACK_TOKEN=${SLACK_TOKEN}
NOTION_TOKEN=${NOTION_TOKEN}
GEMINI_API_KEY=${GEMINI_API_KEY}
EOF
chmod 600 "${ENV_FILE}"
echo "✓ Wrote ${ENV_FILE}"

echo ""
echo "Adding Coral sources..."
coral source add github --token "${GITHUB_TOKEN}" 2>/dev/null || coral source add github || true
coral source add linear --token "${LINEAR_API_KEY}" 2>/dev/null || coral source add linear || true
coral source add slack --token "${SLACK_TOKEN}" 2>/dev/null || coral source add slack || true
coral source add notion --token "${NOTION_TOKEN}" 2>/dev/null || coral source add notion || true

echo ""
echo "==> Setting up Hermes Agent..."
bash "${REPO_ROOT}/hermes/setup_hermes.sh"

echo ""
echo "==> Registering Sorelax cron job with Hermes..."
bash "${REPO_ROOT}/hermes/register_cron.sh"

echo ""
echo "==> Configuring Claude Code MCP integration..."
CLAUDE_CONFIG="${HOME}/.claude/claude_code_mcp_config.json"
if [[ ! -f "${CLAUDE_CONFIG}" ]]; then
  mkdir -p "${HOME}/.claude"
  cp "${REPO_ROOT}/hermes/claude_code_mcp_config.json" "${CLAUDE_CONFIG}"
  echo "Claude Code MCP config written to ${CLAUDE_CONFIG}"
else
  echo "Claude Code config already exists at ${CLAUDE_CONFIG}"
  echo "Manually add the mcpServers from hermes/claude_code_mcp_config.json"
fi

echo ""
echo "==> Running first Sorelax context refresh..."
cd "${REPO_ROOT}"
export $(grep -v '^#' "${ENV_FILE}" | xargs)
python3 agent/refresh.py || {
  echo "⚠ First refresh failed — check tokens and 'coral source list'"
}

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║               SORELAX SETUP COMPLETE                     ║"
echo "║                                                          ║"
echo "║  1. Configure Hermes LLM:  hermes model                  ║"
echo "║  2. Start scheduler:       hermes gateway                ║"
echo "║  3. Open Claude Code in this repo — context is ready.    ║"
echo "║                                                          ║"
echo "║  sorelax refresh   — update CLAUDE.md now                ║"
echo "║  sorelax ask \"…\"  — on-demand query                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
