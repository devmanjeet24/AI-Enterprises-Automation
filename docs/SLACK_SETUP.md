# Slack integration setup

Production Slack uses the Slack Web API (`chat.postMessage`) with signed Event Subscriptions. Incoming Webhooks are not used for replies.

## Environment variables (`backend/.env`)

| Variable | Slack App location | Purpose |
|----------|-------------------|---------|
| `SLACK_SIGNING_SECRET` | **Basic Information** → App Credentials → Signing Secret | Verify inbound Event Subscriptions |
| `SLACK_CLIENT_ID` | **Basic Information** → App Credentials → Client ID | OAuth install flow |
| `SLACK_CLIENT_SECRET` | **Basic Information** → App Credentials → Client Secret | OAuth token exchange |
| `SLACK_BOT_TOKEN` | **OAuth & Permissions** → Bot User OAuth Token (`xoxb-...`) | Send replies via `chat.postMessage` |
| `API_PUBLIC_URL` | Your public **backend** ngrok URL (same as `NEXT_PUBLIC_REALTIME_API_URL`) | OAuth redirect + must match Slack App URLs |

## Required bot scopes

Add under **OAuth & Permissions** → **Bot Token Scopes**:

- `chat:write` — send messages
- `im:history` — receive DM messages
- `im:read` — read DM metadata
- `im:write` — open DM conversations
- `channels:history` — receive public channel messages
- `groups:history` — receive private channel messages
- `users:read` — resolve Slack display names
- `app_mentions:read` — receive `@app` mentions in channels

## Slack App configuration

1. Create or open your Slack App at [api.slack.com/apps](https://api.slack.com/apps).
2. **OAuth & Permissions**
   - Add the bot scopes listed above.
   - **Redirect URL**: `{API_PUBLIC_URL}/api/v1/integrations/slack/oauth/callback`
   - Install the app to your workspace and copy the **Bot User OAuth Token** into `SLACK_BOT_TOKEN`.
3. **Event Subscriptions**
   - Enable events.
   - **Request URL**: `{API_PUBLIC_URL}/api/v1/omnichannel-webhooks/slack/{omnichannel_channel_id}`
     - Create the Slack omnichannel channel in the UI first to obtain `{omnichannel_channel_id}`.
   - Subscribe to **Bot Events**:
     - `message.im` — DMs
     - `message.channels` — public channels (invite the bot)
     - `message.groups` — private channels (invite the bot)
     - `app_mention` — `@bot` mentions
4. **Incoming Webhooks** — leave disabled (not used).
5. Copy **Signing Secret**, **Client ID**, and **Client Secret** into `backend/.env`.

## Platform setup

1. Set all Slack env vars and restart the backend.
2. Omnichannel → **Add channel** → type **Slack** → assign an **AI Employee**.
3. Open the channel detail page and copy the **Event Subscriptions Request URL** into Slack.
4. Click **Connect Slack workspace** to run OAuth and bind the workspace `team_id` to the channel.
5. Invite the bot to support channels (for channel mode) or DM the bot (for DM mode).

## Test flow

1. Slack user sends a message (DM, channel, or thread).
2. Slack POSTs a signed event to the Request URL.
3. Omnichannel creates/updates a conversation with `slack_channel_id` and `slack_thread_ts`.
4. The assigned AI Employee runs RAG against the knowledge base.
5. The reply is sent with `chat.postMessage` to the same channel and thread.
