#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
SORELAX_HOME="${HOME}/.sorelax"
HERMES_SKILLS="${HOME}/.hermes/skills"

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
need_cmd hermes || {
  echo "  Hermes optional for skills; continuing without hermes CLI is ok if dir exists"
}

if [[ "${MISSING}" -eq 1 ]]; then
  echo ""
  echo "Install missing tools and re-run install.sh"
  exit 1
fi

echo ""
echo "Installing Python package..."
pip install -e "${REPO_ROOT}"

mkdir -p "${SORELAX_HOME}"
echo "✓ Created ${SORELAX_HOME}"

if [[ -d "${REPO_ROOT}/skills" ]]; then
  mkdir -p "${HERMES_SKILLS}"
  cp -r "${REPO_ROOT}/skills/"* "${HERMES_SKILLS}/" 2>/dev/null || true
  echo "✓ Copied skill files to ${HERMES_SKILLS}"
fi

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
echo "Running first refresh..."
cd "${REPO_ROOT}"
export $(grep -v '^#' "${ENV_FILE}" | xargs)
sorelax refresh || {
  echo "⚠ First refresh failed — check tokens and 'coral source list'"
}

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Sorelax installed successfully!                         ║"
echo "║                                                          ║"
echo "║  sorelax refresh   — update CLAUDE.md now                ║"
echo "║  sorelax ask \"…\"  — on-demand query                     ║"
echo "║  sorelax start     — daemon every 6h                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
