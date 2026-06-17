"""Public website chat widget API (no authentication)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.enums import OmnichannelMessageRole
from app.schemas.omnichannel_conversation import OmnichannelMessageResponse
from app.services.omnichannel_widget_service import (
    add_widget_message,
    get_channel_by_public_key,
    get_widget_config,
    list_widget_messages,
    start_widget_conversation,
)

router = APIRouter(prefix="/omnichannel-widget", tags=["omnichannel-widget"])


class WidgetStartConversationRequest(BaseModel):
    visitor_name: str | None = Field(default=None, max_length=200)
    visitor_email: str | None = Field(default=None, max_length=255)
    visitor_id: str | None = Field(default=None, max_length=255)
    initial_message: str = Field(min_length=1, max_length=4000)


class WidgetMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class WidgetConversationResponse(BaseModel):
    id: uuid.UUID
    subject: str
    status: str


class WidgetMessageItem(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: str


@router.get("/{public_key}/config")
def get_widget_config_endpoint(
    public_key: str,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str | None]:
    channel = get_channel_by_public_key(db, public_key=public_key)
    return get_widget_config(channel)


@router.post(
    "/{public_key}/conversations",
    response_model=WidgetConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_widget_conversation_endpoint(
    public_key: str,
    payload: WidgetStartConversationRequest,
    db: Annotated[Session, Depends(get_db)],
) -> WidgetConversationResponse:
    channel = get_channel_by_public_key(db, public_key=public_key)
    conversation = start_widget_conversation(
        db,
        channel=channel,
        visitor_name=payload.visitor_name,
        visitor_email=payload.visitor_email,
        initial_message=payload.initial_message,
        visitor_id=payload.visitor_id,
    )
    return WidgetConversationResponse(
        id=conversation.id,
        subject=conversation.subject,
        status=conversation.status.value,
    )


@router.get("/{public_key}/conversations/{conversation_id}/messages")
def list_widget_messages_endpoint(
    public_key: str,
    conversation_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> list[WidgetMessageItem]:
    channel = get_channel_by_public_key(db, public_key=public_key)
    messages = list_widget_messages(db, channel=channel, conversation_id=conversation_id)
    return [
        WidgetMessageItem(
            id=message.id,
            role=message.role.value,
            content=message.content,
            created_at=message.created_at.isoformat(),
        )
        for message in messages
    ]


@router.post(
    "/{public_key}/conversations/{conversation_id}/messages",
    response_model=WidgetMessageItem,
    status_code=status.HTTP_201_CREATED,
)
def create_widget_message_endpoint(
    public_key: str,
    conversation_id: uuid.UUID,
    payload: WidgetMessageRequest,
    db: Annotated[Session, Depends(get_db)],
) -> WidgetMessageItem:
    channel = get_channel_by_public_key(db, public_key=public_key)
    message = add_widget_message(
        db,
        channel=channel,
        conversation_id=conversation_id,
        content=payload.content,
        role=OmnichannelMessageRole.CUSTOMER,
    )
    return WidgetMessageItem(
        id=message.id,
        role=message.role.value,
        content=message.content,
        created_at=message.created_at.isoformat(),
    )
