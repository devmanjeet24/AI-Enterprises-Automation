"""Inbound webhooks for external omnichannel connectors."""

import json
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import get_settings
from app.services.omnichannel_webhook_service import (
    process_linkedin_webhook,
    process_slack_webhook,
    process_telegram_webhook,
    process_whatsapp_webhook,
    verify_webhook_channel,
)
from app.services.linkedin_service import compute_webhook_challenge_response
from app.services.slack_service import verify_slack_request_signature

router = APIRouter(prefix="/omnichannel-webhooks", tags=["omnichannel-webhooks"])


@router.post("/telegram/{channel_id}")
async def telegram_webhook_endpoint(
    channel_id: uuid.UUID,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    verify_webhook_channel(db, channel_id=channel_id)
    payload = await request.json()
    message = process_telegram_webhook(db, channel_id=channel_id, payload=payload)
    return {"status": "ok", "message_id": str(message.id) if message else ""}


@router.post("/slack/{channel_id}")
async def slack_webhook_endpoint(
    channel_id: uuid.UUID,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    verify_webhook_channel(db, channel_id=channel_id)
    body = await request.body()
    settings = get_settings()
    verify_slack_request_signature(
        body=body,
        timestamp_header=request.headers.get("X-Slack-Request-Timestamp"),
        signature_header=request.headers.get("X-Slack-Signature"),
        signing_secret=settings.slack_signing_secret,
    )
    payload = json.loads(body.decode("utf-8"))
    result = process_slack_webhook(db, channel_id=channel_id, payload=payload)
    if isinstance(result, dict):
        return result
    return {"status": "ok", "message_id": str(result.id) if result else ""}


@router.get("/whatsapp/{channel_id}")
def whatsapp_webhook_verify_endpoint(
    channel_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    hub_mode: Annotated[str | None, Query(alias="hub.mode")] = None,
    hub_verify_token: Annotated[str | None, Query(alias="hub.verify_token")] = None,
    hub_challenge: Annotated[str | None, Query(alias="hub.challenge")] = None,
) -> Response:
    channel = verify_webhook_channel(db, channel_id=channel_id)
    config = channel.config or {}
    verify_token = config.get("verify_token", "")
    if hub_mode == "subscribe" and hub_verify_token == verify_token and hub_challenge:
        return Response(content=hub_challenge, media_type="text/plain")
    return Response(status_code=403)


@router.post("/whatsapp/{channel_id}")
async def whatsapp_webhook_endpoint(
    channel_id: uuid.UUID,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    verify_webhook_channel(db, channel_id=channel_id)
    payload = await request.json()
    message = process_whatsapp_webhook(db, channel_id=channel_id, payload=payload)
    return {"status": "ok", "message_id": str(message.id) if message else ""}


@router.get("/linkedin/{channel_id}")
def linkedin_webhook_validate_endpoint(
    channel_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    challenge_code: Annotated[str | None, Query(alias="challengeCode")] = None,
) -> dict[str, str]:
    """LinkedIn webhook URL validation challenge (HMAC-SHA256)."""
    verify_webhook_channel(db, channel_id=channel_id)
    settings = get_settings()
    if not challenge_code:
        return {"status": "ok"}
    if not settings.linkedin_client_secret:
        return {"status": "error", "message": "LINKEDIN_CLIENT_SECRET is not configured"}
    return {
        "challengeCode": challenge_code,
        "challengeResponse": compute_webhook_challenge_response(
            challenge_code=challenge_code,
            client_secret=settings.linkedin_client_secret,
        ),
    }


@router.post("/linkedin/{channel_id}")
async def linkedin_webhook_endpoint(
    channel_id: uuid.UUID,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    verify_webhook_channel(db, channel_id=channel_id)
    payload = await request.json()
    message = process_linkedin_webhook(db, channel_id=channel_id, payload=payload)
    return {"status": "ok", "message_id": str(message.id) if message else ""}
