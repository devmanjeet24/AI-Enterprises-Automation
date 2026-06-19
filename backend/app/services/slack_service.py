"""Slack Web API helpers, request verification, and OAuth."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from functools import lru_cache
from typing import Any

from fastapi import HTTPException, status

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

SLACK_API_BASE = "https://slack.com/api"
SLACK_OAUTH_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize"

# Bot scopes required for bidirectional DM, channel, and thread messaging.
SLACK_BOT_SCOPES = (
    "chat:write",
    "im:history",
    "im:read",
    "im:write",
    "channels:history",
    "groups:history",
    "users:read",
    "app_mentions:read",
)


def verify_slack_request_signature(
    *,
    body: bytes,
    timestamp_header: str | None,
    signature_header: str | None,
    signing_secret: str,
    max_age_seconds: int = 60 * 5,
) -> None:
    """Validate Slack's X-Slack-Signature using the app signing secret."""
    if not signing_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack signing secret is not configured",
        )
    if not timestamp_header or not signature_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Slack signature headers",
        )

    try:
        request_age = abs(time.time() - int(timestamp_header))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Slack request timestamp",
        ) from exc

    if request_age > max_age_seconds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Slack request timestamp is too old",
        )

    basestring = f"v0:{timestamp_header}:{body.decode('utf-8')}"
    computed = (
        "v0="
        + hmac.new(
            signing_secret.encode("utf-8"),
            basestring.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
    )
    if not hmac.compare_digest(computed, signature_header):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Slack request signature",
        )


def _slack_api_request(
    method: str,
    *,
    bot_token: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    url = f"{SLACK_API_BASE}/{method}"
    body = json.dumps(payload or {}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {bot_token}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        logger.warning("Slack API HTTP error %s for %s", exc.code, method)
        return {"ok": False, "error": f"http_{exc.code}"}
    except urllib.error.URLError as exc:
        logger.warning("Slack API URL error for %s: %s", method, exc.reason)
        return {"ok": False, "error": "network_error"}

    if not data.get("ok"):
        logger.warning("Slack API %s failed: %s", method, data.get("error"))
    return data


def post_chat_message(
    *,
    bot_token: str,
    channel: str,
    text: str,
    thread_ts: str | None = None,
) -> dict[str, Any]:
    """Send a message via chat.postMessage."""
    payload: dict[str, Any] = {"channel": channel, "text": text}
    if thread_ts:
        payload["thread_ts"] = thread_ts
    return _slack_api_request("chat.postMessage", bot_token=bot_token, payload=payload)


@lru_cache(maxsize=1)
def _cached_bot_user_id(bot_token: str) -> str | None:
    data = _slack_api_request("auth.test", bot_token=bot_token)
    if data.get("ok"):
        return data.get("user_id")
    return None


def get_bot_user_id(*, bot_token: str) -> str | None:
    if not bot_token:
        return None
    return _cached_bot_user_id(bot_token)


def resolve_user_display_name(*, bot_token: str, user_id: str) -> str | None:
    data = _slack_api_request(
        "users.info",
        bot_token=bot_token,
        payload={"user": user_id},
    )
    if not data.get("ok"):
        return None
    profile = data.get("user", {}).get("profile", {})
    return (
        profile.get("display_name")
        or profile.get("real_name")
        or data.get("user", {}).get("name")
    )


def build_slack_oauth_authorize_url(
    *,
    client_id: str,
    redirect_uri: str,
    state: str,
    scopes: str = ",".join(SLACK_BOT_SCOPES),
) -> str:
    params = {
        "client_id": client_id,
        "scope": scopes,
        "redirect_uri": redirect_uri,
        "state": state,
    }
    return f"{SLACK_OAUTH_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


def exchange_slack_oauth_code(
    *,
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
) -> dict[str, Any]:
    """Exchange an OAuth authorization code for workspace installation metadata."""
    payload = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{SLACK_API_BASE}/oauth.v2.access",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        logger.warning("Slack OAuth HTTP error %s", exc.code)
        return {"ok": False, "error": f"http_{exc.code}"}
    except urllib.error.URLError as exc:
        logger.warning("Slack OAuth URL error: %s", exc.reason)
        return {"ok": False, "error": "network_error"}


def resolve_slack_bot_token(settings: Settings | None = None) -> str:
    resolved = settings or get_settings()
    return resolved.slack_bot_token.strip()


def slack_oauth_redirect_uri(settings: Settings | None = None) -> str:
    resolved = settings or get_settings()
    base = resolved.api_public_url.strip().rstrip("/")
    if not base:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API_PUBLIC_URL is not configured",
        )
    return f"{base}{resolved.api_v1_prefix}/integrations/slack/oauth/callback"
