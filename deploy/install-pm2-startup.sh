#!/usr/bin/env bash
# Register PM2 to start on system boot for user newjoinee, then save the process list.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

chmod +x "$ROOT/deploy/start-ngrok.sh" "$ROOT/deploy/sync-ngrok-urls.sh" "$ROOT/deploy/post-boot-sync.sh"

echo "Starting apps from ecosystem..."
cd "$ROOT"
pm2 delete ai-ngrok-sync 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs --only ai-backend,ai-frontend,ai-ngrok

echo "Waiting for ngrok..."
sleep 5
"$ROOT/deploy/sync-ngrok-urls.sh" || true

pm2 save

# After reboot, ngrok free URLs may change — sync env + rebuild if needed.
CRON_LINE="@reboot sleep 45 && $ROOT/deploy/post-boot-sync.sh >> $ROOT/deploy/boot-sync.log 2>&1"
if ! crontab -l 2>/dev/null | grep -Fq "post-boot-sync.sh"; then
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Added @reboot cron to sync ngrok URLs after system start."
fi

echo ""
echo "=== PM2 startup (run once with sudo if not already enabled) ==="
pm2 startup systemd -u newjoinee --hp /home/newjoinee 2>&1 | tail -3

echo ""
echo "If prompted above, copy/paste the sudo command, then run: pm2 save"
echo "Public URLs are in: deploy/public-urls.txt"
