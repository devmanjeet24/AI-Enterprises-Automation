#!/usr/bin/env bash
# Waits for ngrok tunnels, then syncs public URLs into env files (one-shot helper).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[ai-ngrok-sync] Waiting for ngrok tunnels..."
for _ in $(seq 1 60); do
  if "$ROOT/deploy/sync-ngrok-urls.sh" 2>/dev/null; then
    echo "[ai-ngrok-sync] URLs synced."
    exit 0
  fi
  sleep 2
done

echo "[ai-ngrok-sync] Timed out waiting for ngrok." >&2
exit 1
