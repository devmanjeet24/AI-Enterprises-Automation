"""Inbound webhooks for external omnichannel connectors."""

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.omnichannel_webhook_service import (
    process_slack_webhook,
    process_telegram_webhook,
    process_whatsapp_webhook,
    verify_webhook_channel,
)

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
    payload = await request.json()
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
