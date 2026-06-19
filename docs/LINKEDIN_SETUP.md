# LinkedIn integration setup

Production LinkedIn omnichannel uses the **Community Management API** for Company Page comment engagement. Inbound events arrive via Organization Social Action Notifications webhooks; replies are sent with the `socialActions/comments` API.

## LinkedIn Developer Portal requirements

| Requirement | Details |
|-------------|---------|
| **Product** | [Community Management API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview) (Development tier minimum) |
| **Approval** | Access request form + LinkedIn review ([App Review criteria](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review)) |
| **Company Page** | App must be linked to a verified LinkedIn Company Page; connecting member must be **ADMINISTRATOR** |
| **Webhooks (real-time)** | Disabled on Development tier; **Standard tier** required for production push notifications |
| **Not supported** | LinkedIn DMs, Page inbox messaging (no public API) |

### OAuth scopes (granted after Community Management approval)

- `r_organization_social_feed` — read comments and social actions
- `w_organization_social_feed` — reply to comments
- `rw_organization_admin` — manage Page + subscribe to webhooks
- `r_organization_social` / `w_organization_social` — read/write org posts

## Environment variables (`backend/.env`)

| Variable | LinkedIn App location | Purpose |
|----------|----------------------|---------|
| `LINKEDIN_CLIENT_ID` | **Auth** tab → Client ID | OAuth authorize + token exchange |
| `LINKEDIN_CLIENT_SECRET` | **Auth** tab → Primary Client Secret | OAuth + webhook challenge HMAC |
| `API_PUBLIC_URL` | Your public **backend** URL (same as `NEXT_PUBLIC_REALTIME_API_URL`) | OAuth redirect + webhook base URL |
| `LINKEDIN_API_VERSION` | Optional (default `202601`) | `LinkedIn-Version` REST header |
| `LINKEDIN_DEVELOPER_APPLICATION_ID` | Optional — numeric app ID from portal URL | Event subscription registration if different from client ID |

## LinkedIn App configuration

1. Create or open your app at [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps).
2. **Products** → request **Community Management API** (Development tier).
3. **Auth** tab:
   - **Redirect URL**: `{API_PUBLIC_URL}/api/v1/integrations/linkedin/oauth/callback`
4. Copy **Client ID** and **Client Secret** into `backend/.env`.

## Platform setup

1. Set LinkedIn env vars and restart the backend.
2. Run migrations: `uv run alembic upgrade head`
3. Omnichannel → **Add channel** → type **LinkedIn** → assign an **AI Employee**.
4. Open the channel detail page and note:
   - **Social Actions Webhook URL**: `{API_PUBLIC_URL}/api/v1/omnichannel-webhooks/linkedin/{channel_id}`
   - **OAuth Redirect URL**: `{API_PUBLIC_URL}/api/v1/integrations/linkedin/oauth/callback`
5. Click **Connect LinkedIn Company Page** to run OAuth (Page admin required).
6. On successful connect, tokens and organization URN are stored on the channel; webhook subscription is attempted automatically.

## Test flow

1. External member comments on a **public** Company Page post.
2. LinkedIn POSTs a social action notification to the webhook URL (Standard tier) or poll manually in Dev tier.
3. Omnichannel creates/updates a conversation with `linkedin_source_post_urn` and `linkedin_reply_target_urn` in `shared_context`.
4. The assigned AI Employee runs RAG and generates a reply.
5. The reply is posted as an organization comment via `POST /rest/socialActions/{urn}/comments`.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/integrations/linkedin/install?channel_id={uuid}` | Start OAuth |
| GET | `/api/v1/integrations/linkedin/oauth/callback` | OAuth callback |
| GET | `/api/v1/omnichannel-webhooks/linkedin/{channel_id}?challengeCode=...` | Webhook validation |
| POST | `/api/v1/omnichannel-webhooks/linkedin/{channel_id}` | Inbound social actions |

## References

- [Authorization Code Flow (3-legged OAuth)](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Comments API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api)
- [Organization Social Action Notifications](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-social-action-notifications)
- [Webhook validation](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/webhook-validation)
