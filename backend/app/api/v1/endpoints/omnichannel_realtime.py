"""Server-Sent Events stream for omnichannel real-time updates."""

import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import OMNICHANNEL_CONVERSATIONS_READ
from app.core.security import decode_access_token
from app.models.user import User
from app.services.omnichannel_event_bus import omnichannel_event_bus
from app.core.authorization import get_user_permission_slugs

router = APIRouter(prefix="/omnichannel-realtime", tags=["omnichannel-realtime"])


def _resolve_sse_user(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
    token: Annotated[str | None, Query()] = None,
) -> User:
    raw_token = token
    if raw_token is None and authorization and authorization.lower().startswith("bearer "):
        raw_token = authorization[7:].strip()
    if raw_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(raw_token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(User, uuid.UUID(str(user_id)))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    permission_slugs = get_user_permission_slugs(db, user)
    if OMNICHANNEL_CONVERSATIONS_READ not in permission_slugs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission '{OMNICHANNEL_CONVERSATIONS_READ}' required",
        )
    return user


@router.get("/events")
async def omnichannel_events_stream(
    current_user: Annotated[User, Depends(_resolve_sse_user)],
) -> StreamingResponse:
    """SSE stream of omnichannel events for the current organization."""
    organization_id = current_user.organization_id

    async def event_generator():
        queue = await omnichannel_event_bus.subscribe(organization_id)
        try:
            yield "event: connected\ndata: {}\n\n"
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"event: update\ndata: {payload}\n\n"
                except asyncio.TimeoutError:
                    yield "event: ping\ndata: {}\n\n"
        finally:
            await omnichannel_event_bus.unsubscribe(organization_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
