"""LinkedIn OAuth install flow for Company Page connection."""

from __future__ import annotations

import time
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import get_settings
from app.models.enums import OmnichannelChannelType
from app.models.omnichannel_channel import OmnichannelChannel
from app.services.linkedin_service import (
    LINKEDIN_OAUTH_SCOPES,
    build_linkedin_oauth_authorize_url,
    exchange_linkedin_oauth_code,
    get_organization,
    get_userinfo,
    linkedin_oauth_redirect_uri,
    list_admin_organizations,
    member_subscription_urn,
    person_urn_from_sub,
    developer_application_urn,
    resolve_developer_application_id,
    subscribe_organization_notifications,
)

router = APIRouter(prefix="/integrations/linkedin", tags=["linkedin-integration"])


def _resolve_organization(
    *,
    channel_config: dict,
    admin_orgs: list[dict],
) -> tuple[str, str | None]:
    configured = channel_config.get("linkedin_organization_urn")
    if configured:
        for entry in admin_orgs:
            org_target = entry.get("organization") or entry.get("organizationalTarget")
            if org_target == configured:
                return configured, None
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configured linkedin_organization_urn is not administered by this member",
        )

    if not admin_orgs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No LinkedIn Company Pages found for this member (ADMINISTRATOR role required)",
        )

    first = admin_orgs[0]
    org_urn = first.get("organization") or first.get("organizationalTarget")
    if not org_urn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not resolve LinkedIn organization URN from ACL response",
        )
    return str(org_urn), None


@router.get("/install")
def linkedin_install(
    channel_id: Annotated[uuid.UUID, Query(description="Omnichannel LinkedIn channel ID")],
    db: Annotated[Session, Depends(get_db)],
) -> RedirectResponse:
    """Redirect an admin to LinkedIn OAuth to connect a Company Page."""
    settings = get_settings()
    if not settings.linkedin_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LINKEDIN_CLIENT_ID is not configured",
        )

    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None or channel.channel_type != OmnichannelChannelType.LINKEDIN:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LinkedIn channel not found")

    authorize_url = build_linkedin_oauth_authorize_url(
        client_id=settings.linkedin_client_id,
        redirect_uri=linkedin_oauth_redirect_uri(settings),
        state=str(channel_id),
    )
    return RedirectResponse(url=authorize_url, status_code=status.HTTP_302_FOUND)


@router.get("/oauth/callback")
def linkedin_oauth_callback(
    db: Annotated[Session, Depends(get_db)],
    code: Annotated[str | None, Query()] = None,
    state: Annotated[str | None, Query()] = None,
    error: Annotated[str | None, Query()] = None,
    error_description: Annotated[str | None, Query()] = None,
) -> dict[str, str]:
    """Handle LinkedIn OAuth redirect and persist tokens plus Page metadata on the channel."""
    settings = get_settings()
    if error:
        detail = error_description or error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"LinkedIn OAuth denied: {detail}",
        )
    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing LinkedIn OAuth code or state",
        )
    if not settings.linkedin_client_id or not settings.linkedin_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LinkedIn OAuth credentials are not configured",
        )

    try:
        channel_id = uuid.UUID(state)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state",
        ) from exc

    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None or channel.channel_type != OmnichannelChannelType.LINKEDIN:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LinkedIn channel not found")

    redirect_uri = linkedin_oauth_redirect_uri(settings)
    token_response = exchange_linkedin_oauth_code(
        client_id=settings.linkedin_client_id,
        client_secret=settings.linkedin_client_secret,
        code=code,
        redirect_uri=redirect_uri,
    )
    access_token = token_response.get("access_token")
    if not access_token:
        error_msg = token_response.get("error_description") or token_response.get("error", "unknown")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"LinkedIn OAuth failed: {error_msg}",
        )

    userinfo = get_userinfo(access_token=access_token)
    member_sub = userinfo.get("sub")
    if not member_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LinkedIn OAuth succeeded but member identity could not be resolved",
        )

    member_urn = person_urn_from_sub(str(member_sub))
    admin_orgs = list_admin_organizations(access_token=access_token, settings=settings)
    channel_config = dict(channel.config or {})
    organization_urn, _ = _resolve_organization(
        channel_config=channel_config,
        admin_orgs=admin_orgs,
    )

    org_name = None
    org_data = get_organization(
        access_token=access_token,
        organization_urn=organization_urn,
        settings=settings,
    )
    if org_data.get("localizedName"):
        org_name = org_data["localizedName"]
    elif isinstance(org_data.get("name"), dict):
        localized = org_data["name"].get("localized", {})
        if localized:
            org_name = next(iter(localized.values()), None)

    expires_in = token_response.get("expires_in")
    oauth_expires_at = None
    if expires_in is not None:
        oauth_expires_at = time.time() + int(expires_in)

    config = dict(channel.config or {})
    config.update(
        {
            "linkedin_organization_urn": organization_urn,
            "linkedin_organization_name": org_name,
            "linkedin_member_urn": member_urn,
            "linkedin_member_name": userinfo.get("name"),
            "oauth_access_token": access_token,
            "oauth_refresh_token": token_response.get("refresh_token"),
            "oauth_expires_at": oauth_expires_at,
            "oauth_scope": token_response.get("scope", " ".join(LINKEDIN_OAUTH_SCOPES)),
        }
    )
    channel.config = config
    db.commit()

    webhook_base = settings.api_public_url.strip().rstrip("/")
    webhook_url = (
        f"{webhook_base}{settings.api_v1_prefix}/omnichannel-webhooks/linkedin/{channel.id}"
    )
    subscription = subscribe_organization_notifications(
        access_token=access_token,
        developer_application_urn=developer_application_urn(
            application_id=resolve_developer_application_id(settings),
        ),
        member_urn=member_subscription_urn(member_sub=str(member_sub)),
        organization_urn=organization_urn,
        webhook_url=webhook_url,
        settings=settings,
    )
    subscription_failed = subscription.get("ok") is False or int(subscription.get("status", 200)) >= 400
    if not subscription_failed:
        config["linkedin_webhook_url"] = webhook_url
        config["linkedin_webhook_subscribed"] = True
        channel.config = config
        db.commit()

    return {
        "status": "connected",
        "organization_urn": organization_urn,
        "organization_name": org_name or "",
        "member_urn": member_urn,
        "scopes": config.get("oauth_scope", ""),
    }
