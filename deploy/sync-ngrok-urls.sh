#!/usr/bin/env bash
# Read active ngrok tunnels and update frontend/backend env when URLs change.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_ENV="$ROOT/frontend/.env"
BACKEND_ENV="$ROOT/backend/.env"
URLS_FILE="$ROOT/deploy/public-urls.txt"

find_ngrok_api_port() {
  local port
  for port in $(seq 4040 4055); do
    if curl -sf "http://127.0.0.1:${port}/api/tunnels" >/dev/null 2>&1; then
      local tunnels
      tunnels="$(curl -sf "http://127.0.0.1:${port}/api/tunnels")"
      if echo "$tunnels" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if any(t.get('name')=='ai-frontend' for t in d.get('tunnels',[])) else 1)" 2>/dev/null; then
        echo "$port"
        return 0
      fi
    fi
  done
  return 1
}

API_PORT="$(find_ngrok_api_port || true)"
if [[ -z "$API_PORT" ]]; then
  echo "Could not find ai-ngrok inspector API. Is ai-ngrok running?" >&2
  exit 1
fi

read -r FRONTEND_URL BACKEND_URL < <(
  curl -sf "http://127.0.0.1:${API_PORT}/api/tunnels" | python3 -c "
import json, sys
data = json.load(sys.stdin)
urls = {t['name']: t['public_url'] for t in data.get('tunnels', [])}
print(urls.get('ai-frontend', ''), urls.get('ai-backend', ''))
"
)

if [[ -z "$FRONTEND_URL" || -z "$BACKEND_URL" ]]; then
  echo "Missing tunnel URLs from ngrok (frontend=$FRONTEND_URL backend=$BACKEND_URL)" >&2
  exit 1
fi

cat >"$URLS_FILE" <<EOF
# Updated $(date -u +"%Y-%m-%dT%H:%M:%SZ")
FRONTEND_URL=$FRONTEND_URL
BACKEND_URL=$BACKEND_URL
EOF

echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"

PREV_APP_URL="$(grep -E '^NEXT_PUBLIC_APP_URL=' "$FRONTEND_ENV" 2>/dev/null | cut -d= -f2- || true)"
NEEDS_BUILD=false
if [[ "$PREV_APP_URL" != "$FRONTEND_URL" ]]; then
  NEEDS_BUILD=true
fi

cat >"$FRONTEND_ENV" <<EOF
# Public HTTPS (ngrok) — required for microphone recording in Voice Assistant
NEXT_PUBLIC_APP_URL=$FRONTEND_URL
# Same origin: Next.js rewrites /api/v1/* to the backend on port 20378
NEXT_PUBLIC_API_URL=$FRONTEND_URL
# SSE connects directly to the backend tunnel (long-lived streams bypass Next.js proxy)
NEXT_PUBLIC_REALTIME_API_URL=$BACKEND_URL

# Direct HTTP access (no microphone — upload only)
# NEXT_PUBLIC_APP_URL=http://116.202.210.102:20380
# NEXT_PUBLIC_API_URL=http://116.202.210.102:20378
EOF

python3 <<PY
from pathlib import Path
import re

path = Path("$BACKEND_ENV")
text = path.read_text()
cors = (
    "http://116.202.210.102:20380,http://127.0.0.1:20380,http://localhost:20380,"
    f"$FRONTEND_URL,$BACKEND_URL"
)
if re.search(r"^CORS_ORIGINS=.*$", text, flags=re.M):
    text = re.sub(r"^CORS_ORIGINS=.*$", f"CORS_ORIGINS={cors}", text, flags=re.M)
else:
    text += f"\nCORS_ORIGINS={cors}\n"
text = re.sub(r"^public_test_url=.*$", f"public_test_url=$FRONTEND_URL", text, flags=re.M)
text = re.sub(r"^public_api_url=.*$", f"public_api_url=$BACKEND_URL", text, flags=re.M)
if re.search(r"^API_PUBLIC_URL=.*$", text, flags=re.M):
    text = re.sub(r"^API_PUBLIC_URL=.*$", f"API_PUBLIC_URL=$BACKEND_URL", text, flags=re.M)
else:
    text += f"\nAPI_PUBLIC_URL=$BACKEND_URL\n"
path.write_text(text)
PY

if [[ "$NEEDS_BUILD" == true ]]; then
  echo "Ngrok URL changed — rebuilding frontend..."
  (cd "$ROOT/frontend" && npm run build)
  pm2 restart ai-frontend ai-backend
else
  echo "URLs unchanged — skipping frontend rebuild."
  pm2 restart ai-backend
fi

echo "Done. Open: $FRONTEND_URL"
