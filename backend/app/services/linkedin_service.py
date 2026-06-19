"""LinkedIn OAuth, REST API helpers, and webhook validation."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from fastapi import HTTPException, status

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

LINKEDIN_OAUTH_AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_OAUTH_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_API_BASE = "https://api.linkedin.com/rest"
LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
LINKEDIN_API_VERSION = "202601"

# Community Management API scopes (requires approved product access).
LINKEDIN_OAUTH_SCOPES = (
    "r_organization_social_feed",
    "w_organization_social_feed",
    "rw_organization_admin",
    "r_organization_social",
    "w_organization_social",
)


def linkedin_oauth_redirect_uri(settings: Settings | None = None) -> str:
    resolved = settings or get_settings()
    base = resolved.api_public_url.strip().rstrip("/")
    if not base:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API_PUBLIC_URL is not configured",
        )
    return f"{base}{resolved.api_v1_prefix}/integrations/linkedin/oauth/callback"


def build_linkedin_oauth_authorize_url(
    *,
    client_id: str,
    redirect_uri: str,
    state: str,
    scopes: str = " ".join(LINKEDIN_OAUTH_SCOPES),
) -> str:
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": scopes,
    }
    return f"{LINKEDIN_OAUTH_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


def exchange_linkedin_oauth_code(
    *,
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
) -> dict[str, Any]:
    payload = urllib.parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        LINKEDIN_OAUTH_TOKEN_URL,
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        logger.warning("LinkedIn OAuth HTTP error %s: %s", exc.code, body)
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {"error": f"http_{exc.code}", "error_description": body}
    except urllib.error.URLError as exc:
        logger.warning("LinkedIn OAuth URL error: %s", exc.reason)
        return {"error": "network_error", "error_description": str(exc.reason)}


def compute_webhook_challenge_response(*, challenge_code: str, client_secret: str) -> str:
    """Hex-encoded HMACSHA256(challengeCode, clientSecret) per LinkedIn webhook validation."""
    digest = hmac.new(
        client_secret.encode("utf-8"),
        challenge_code.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return digest


def encode_linkedin_urn(urn: str) -> str:
    return urllib.parse.quote(urn, safe="")


def _linkedin_api_version(settings: Settings | None = None) -> str:
    resolved = settings or get_settings()
    return resolved.linkedin_api_version.strip() or LINKEDIN_API_VERSION


def linkedin_rest_request(
    method: str,
    path: str,
    *,
    access_token: str,
    payload: dict[str, Any] | None = None,
    settings: Settings | None = None,
) -> dict[str, Any]:
    url = f"{LINKEDIN_API_BASE}/{path.lstrip('/')}"
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": _linkedin_api_version(settings),
    }
    request = urllib.request.Request(url, data=body, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return {"ok": True}
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        logger.warning("LinkedIn API HTTP error %s for %s: %s", exc.code, path, error_body)
        try:
            parsed = json.loads(error_body)
        except json.JSONDecodeError:
            parsed = {"message": error_body}
        parsed["ok"] = False
        parsed["status"] = exc.code
        return parsed
    except urllib.error.URLError as exc:
        logger.warning("LinkedIn API URL error for %s: %s", path, exc.reason)
        return {"ok": False, "error": "network_error", "message": str(exc.reason)}


def get_userinfo(*, access_token: str) -> dict[str, Any]:
    request = urllib.request.Request(
        LINKEDIN_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        logger.warning("LinkedIn userinfo HTTP error %s: %s", exc.code, body)
        return {"ok": False, "status": exc.code, "message": body}
    except urllib.error.URLError as exc:
        logger.warning("LinkedIn userinfo URL error: %s", exc.reason)
        return {"ok": False, "error": "network_error", "message": str(exc.reason)}


def list_admin_organizations(*, access_token: str, settings: Settings | None = None) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode(
        {
            "q": "roleAssignee",
            "role": "ADMINISTRATOR",
            "state": "APPROVED",
        }
    )
    data = linkedin_rest_request(
        "GET",
        f"organizationAcls?{query}",
        access_token=access_token,
        settings=settings,
    )
    return list(data.get("elements") or [])


def get_organization(*, access_token: str, organization_urn: str, settings: Settings | None = None) -> dict[str, Any]:
    org_id = organization_urn.rsplit(":", 1)[-1]
    return linkedin_rest_request(
        "GET",
        f"organizations/{org_id}",
        access_token=access_token,
        settings=settings,
    )


def resolve_access_token(config: dict[str, Any]) -> str:
    return str(config.get("oauth_access_token") or "").strip()


def token_expires_at(config: dict[str, Any]) -> float | None:
    raw = config.get("oauth_expires_at")
    if raw is None:
        return None
    try:
        return float(raw)
    except (TypeError, ValueError):
        return None


def is_access_token_expired(config: dict[str, Any], *, skew_seconds: int = 300) -> bool:
    expires_at = token_expires_at(config)
    if expires_at is None:
        return False
    return time.time() >= expires_at - skew_seconds


def create_comment(
    *,
    access_token: str,
    target_urn: str,
    actor_urn: str,
    object_urn: str,
    text: str,
    parent_comment_urn: str | None = None,
    settings: Settings | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "actor": actor_urn,
        "object": object_urn,
        "message": {"text": text},
    }
    if parent_comment_urn:
        payload["parentComment"] = parent_comment_urn
    encoded_target = encode_linkedin_urn(target_urn)
    return linkedin_rest_request(
        "POST",
        f"socialActions/{encoded_target}/comments",
        access_token=access_token,
        payload=payload,
        settings=settings,
    )


def get_comment(
    *,
    access_token: str,
    target_urn: str,
    comment_id: str,
    settings: Settings | None = None,
) -> dict[str, Any]:
    encoded_target = encode_linkedin_urn(target_urn)
    return linkedin_rest_request(
        "GET",
        f"socialActions/{encoded_target}/comments/{encode_linkedin_urn(comment_id)}",
        access_token=access_token,
        settings=settings,
    )


def subscribe_organization_notifications(
    *,
    access_token: str,
    developer_application_urn: str,
    member_urn: str,
    organization_urn: str,
    webhook_url: str,
    settings: Settings | None = None,
) -> dict[str, Any]:
    key = (
        f"(developerApplication:{encode_linkedin_urn(developer_application_urn)},"
        f"user:{encode_linkedin_urn(member_urn)},"
        f"entity:{encode_linkedin_urn(organization_urn)},"
        f"eventType:ORGANIZATION_SOCIAL_ACTION_NOTIFICATIONS)"
    )
    return linkedin_rest_request(
        "PUT",
        f"eventSubscriptions/{key}",
        access_token=access_token,
        payload={"webhook": webhook_url},
        settings=settings,
    )


def person_urn_from_sub(sub: str) -> str:
    return f"urn:li:person:{sub}"


def developer_application_urn(*, application_id: str) -> str:
    return f"urn:li:developerApplication:{application_id}"


def member_subscription_urn(*, member_sub: str) -> str:
    """Event subscriptions use urn:li:user per LinkedIn REST docs."""
    return f"urn:li:user:{member_sub}"


def resolve_developer_application_id(settings: Settings | None = None) -> str:
    resolved = settings or get_settings()
    explicit = resolved.linkedin_developer_application_id.strip()
    if explicit:
        return explicit
    return resolved.linkedin_client_id.strip()
