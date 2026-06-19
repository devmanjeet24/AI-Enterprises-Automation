#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/deploy/ngrok.env"
CONFIG="$ROOT/deploy/ngrok.yml"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${NGROK_AUTHTOKEN:-}" ]]; then
  echo "NGROK_AUTHTOKEN is not set. Copy deploy/ngrok.env.example to deploy/ngrok.env" >&2
  exit 1
fi

exec /snap/bin/ngrok start ai-frontend ai-backend --config "$CONFIG" --log stdout
