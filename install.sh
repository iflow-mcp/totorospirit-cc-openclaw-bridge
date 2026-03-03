#!/bin/bash
# Install cc-openclaw-bridge into Claude Code
# Usage: ./install.sh [--install-dir /path/to/dir]

set -e

# Parse args
INSTALL_DIR=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --install-dir) INSTALL_DIR="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
CLAUDE_MD="${CLAUDE_DIR}/CLAUDE.md"
MARKER_START="<!-- OPENCLAW-BRIDGE:START -->"
MARKER_END="<!-- OPENCLAW-BRIDGE:END -->"

# Detect if running from temp dir — suggest persistent location
if [ -z "$INSTALL_DIR" ]; then
  case "$SCRIPT_DIR" in
    /tmp/*|/var/tmp/*)
      INSTALL_DIR="${HOME}/.local/share/cc-openclaw-bridge"
      echo "⚠️  Running from temp directory. Installing to ${INSTALL_DIR}"
      ;;
    *)
      INSTALL_DIR="$SCRIPT_DIR"
      ;;
  esac
fi

# Copy to persistent location if needed
if [ "$INSTALL_DIR" != "$SCRIPT_DIR" ]; then
  echo "→ Copying to ${INSTALL_DIR}..."
  mkdir -p "$INSTALL_DIR"
  cp -r "${SCRIPT_DIR}/src" "${SCRIPT_DIR}/dist" "${SCRIPT_DIR}/package.json" "${SCRIPT_DIR}/package-lock.json" \
        "${SCRIPT_DIR}/CLAUDE.md" "${SCRIPT_DIR}/LICENSE" "${SCRIPT_DIR}/README.md" \
        "${SCRIPT_DIR}/setup-env.mjs" "$INSTALL_DIR/"
fi

echo "📦 Installing cc-openclaw-bridge to ${INSTALL_DIR}..."

# 1. Install npm deps
if [ ! -d "${INSTALL_DIR}/node_modules" ]; then
  echo "→ Installing dependencies..."
  cd "$INSTALL_DIR" && npm install --production --ignore-scripts 2>&1 | tail -1
fi

# 2. Register MCP server
echo "→ Registering MCP server..."
claude mcp remove openclaw-bridge 2>/dev/null || true
claude mcp add --scope user openclaw-bridge -- node "${INSTALL_DIR}/dist/server.js"

# 3. Append instructions to ~/.claude/CLAUDE.md
mkdir -p "$CLAUDE_DIR"

if grep -q "$MARKER_START" "$CLAUDE_MD" 2>/dev/null; then
  echo "→ Updating existing CLAUDE.md block..."
  sed -i "/${MARKER_START}/,/${MARKER_END}/d" "$CLAUDE_MD"
fi

echo "→ Adding instructions to ${CLAUDE_MD}..."
{
  echo ""
  echo "$MARKER_START"
  cat "${INSTALL_DIR}/CLAUDE.md"
  echo "$MARKER_END"
} >> "$CLAUDE_MD"

# 4. Env vars
echo ""
echo "✅ Installed to ${INSTALL_DIR}"
echo ""
echo "Next: configure OpenClaw env vars:"
echo "  node ${INSTALL_DIR}/setup-env.mjs"
echo ""
echo "Or manually add to ~/.claude.json → mcpServers → openclaw-bridge → env:"
echo '  OPENCLAW_GATEWAY_TOKEN, OPENCLAW_GATEWAY_PORT, OPENCLAW_STATE_DIR'
