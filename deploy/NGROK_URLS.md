# Public ngrok URLs (auto-updated by deploy/sync-ngrok-urls.sh)

| Service | URL |
|---------|-----|
| **Frontend (use this — mic works)** | https://203b-2a01-4f8-2200-32a7-00-2.ngrok-free.app |
| **Backend API (direct)** | https://95b1-2a01-4f8-2200-32a7-00-2.ngrok-free.app |
| HTTP fallback (no mic) | http://116.202.210.102:20380 |

## PM2 processes

| Name | Port | Purpose |
|------|------|---------|
| `ai-frontend` | 20380 | Next.js app |
| `ai-backend` | 20378 | FastAPI API |
| `ai-ngrok` | — | HTTPS tunnels for both |

## Commands

```bash
# Start / restart all three
pm2 start deploy/ecosystem.config.cjs

# Refresh URLs after ngrok restart (rebuilds frontend if URL changed)
./deploy/sync-ngrok-urls.sh

# One-time: enable PM2 on boot + save process list
./deploy/install-pm2-startup.sh
```

## After server reboot

1. PM2 auto-starts `ai-backend`, `ai-frontend`, `ai-ngrok` (after `pm2 startup` + `pm2 save`).
2. Cron runs `post-boot-sync.sh` ~45s after boot to update URLs if ngrok assigned new ones.
3. Check `deploy/public-urls.txt` for the current URLs.

**Note:** ngrok free URLs change when the `ai-ngrok` process restarts. While PM2 keeps it running, URLs stay stable. After a full reboot, run `./deploy/sync-ngrok-urls.sh` if the app does not load.
