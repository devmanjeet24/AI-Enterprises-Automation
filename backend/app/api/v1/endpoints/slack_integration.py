"""Slack OAuth install flow for workspace connection."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import get_settings
from app.models.enums import OmnichannelChannelType
from app.models.omnichannel_channel import OmnichannelChannel
from app.services.slack_service import (
    SLACK_BOT_SCOPES,
    build_slack_oauth_authorize_url,
    exchange_slack_oauth_code,
    slack_oauth_redirect_uri,
)

router = APIRouter(prefix="/integrations/slack", tags=["slack-integration"])


@router.get("/install")
def slack_install(
    channel_id: Annotated[uuid.UUID, Query(description="Omnichannel Slack channel ID")],
    db: Annotated[Session, Depends(get_db)],
) -> RedirectResponse:
    """Redirect an admin to Slack OAuth to install the app in their workspace."""
    settings = get_settings()
    if not settings.slack_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SLACK_CLIENT_ID is not configured",
        )

    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None or channel.channel_type != OmnichannelChannelType.SLACK:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slack channel not found")

    authorize_url = build_slack_oauth_authorize_url(
        client_id=settings.slack_client_id,
        redirect_uri=slack_oauth_redirect_uri(settings),
        state=str(channel_id),
        scopes=",".join(SLACK_BOT_SCOPES),
    )
    return RedirectResponse(url=authorize_url, status_code=status.HTTP_302_FOUND)


@router.get("/oauth/callback")
def slack_oauth_callback(
    db: Annotated[Session, Depends(get_db)],
    code: Annotated[str | None, Query()] = None,
    state: Annotated[str | None, Query()] = None,
    error: Annotated[str | None, Query()] = None,
) -> dict[str, str]:
    """Handle Slack OAuth redirect and persist workspace metadata on the channel."""
    settings = get_settings()
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slack OAuth denied: {error}",
        )
    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Slack OAuth code or state",
        )
    if not settings.slack_client_id or not settings.slack_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack OAuth credentials are not configured",
        )

    try:
        channel_id = uuid.UUID(state)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state",
        ) from exc

    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None or channel.channel_type != OmnichannelChannelType.SLACK:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slack channel not found")

    oauth_response = exchange_slack_oauth_code(
        client_id=settings.slack_client_id,
        client_secret=settings.slack_client_secret,
        code=code,
        redirect_uri=slack_oauth_redirect_uri(settings),
    )
    if not oauth_response.get("ok"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slack OAuth failed: {oauth_response.get('error', 'unknown')}",
        )

    team = oauth_response.get("team", {})
    config = dict(channel.config or {})
    config.update(
        {
            "slack_team_id": team.get("id"),
            "slack_team_name": team.get("name"),
            "slack_bot_user_id": oauth_response.get("bot_user_id"),
            "slack_app_id": oauth_response.get("app_id"),
        }
    )
    channel.config = config
    db.commit()

    return {
        "status": "connected",
        "team_id": team.get("id", ""),
        "team_name": team.get("name", ""),
        "scopes": ",".join(SLACK_BOT_SCOPES),
    }
