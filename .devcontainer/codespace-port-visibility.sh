#!/usr/bin/env bash
set -euo pipefail

if [ -z "${CODESPACE_NAME:-}" ] || [ -z "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]; then
  echo "==> Not running in Codespaces; skipping port visibility update"
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "==> gh CLI not installed yet; skipping Codespaces port visibility update"
  exit 0
fi

set +e
gh codespace ports visibility 3000:public -c "$CODESPACE_NAME" >/dev/null 2>&1
status_3000=$?
gh codespace ports visibility 5173:public -c "$CODESPACE_NAME" >/dev/null 2>&1
status_5173=$?
set -e

if [ "$status_3000" -ne 0 ] || [ "$status_5173" -ne 0 ]; then
  echo "==> Codespaces port visibility update was not allowed by GitHub policy or auth; continuing without it"
  exit 0
fi

echo "==> Codespaces port visibility set to public for 3000 and 5173"
