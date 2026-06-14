"""Omnichannel communication channel endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.authorization import require_permission
from app.core.permissions import (
    OMNICHANNEL_CHANNELS_DELETE,
    OMNICHANNEL_CHANNELS_READ,
    OMNICHANNEL_CHANNELS_WRITE,
)
from app.models.user import User
from app.schemas.omnichannel_channel import (
    OmnichannelAnalyticsResponse,
    OmnichannelChannelCreateRequest,
    OmnichannelChannelDetailResponse,
    OmnichannelChannelResponse,
    OmnichannelChannelUpdateRequest,
)
from app.services.omnichannel_analytics_service import get_omnichannel_analytics
from app.services.omnichannel_channel_service import (
    build_omnichannel_channel_detail_response,
    create_omnichannel_channel,
    delete_omnichannel_channel,
    get_omnichannel_channel_or_404,
    list_omnichannel_channels,
    update_omnichannel_channel,
)

router = APIRouter(prefix="/omnichannel-channels", tags=["omnichannel-channels"])


@router.get("/analytics", response_model=OmnichannelAnalyticsResponse)
def get_omnichannel_analytics_endpoint(
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CHANNELS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelAnalyticsResponse:
    """Aggregate omnichannel communication metrics."""
    return get_omnichannel_analytics(db, organization_id=current_user.organization_id)


@router.post("", response_model=OmnichannelChannelResponse, status_code=status.HTTP_201_CREATED)
def create_omnichannel_channel_endpoint(
    payload: OmnichannelChannelCreateRequest,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CHANNELS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelChannelResponse:
    """Create an omnichannel communication channel."""
    return create_omnichannel_channel(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[OmnichannelChannelResponse])
def list_omnichannel_channels_endpoint(
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CHANNELS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[OmnichannelChannelResponse]:
    """List omnichannel channels in the current organization."""
    return list_omnichannel_channels(db, organization_id=current_user.organization_id)


@router.get("/{channel_id}", response_model=OmnichannelChannelDetailResponse)
def get_omnichannel_channel_endpoint(
    channel_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CHANNELS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelChannelDetailResponse:
    """Get one omnichannel channel with linked employee details."""
    channel = get_omnichannel_channel_or_404(
        db,
        channel_id=channel_id,
        organization_id=current_user.organization_id,
    )
    return build_omnichannel_channel_detail_response(db, channel=channel)


@router.patch("/{channel_id}", response_model=OmnichannelChannelResponse)
def update_omnichannel_channel_endpoint(
    channel_id: uuid.UUID,
    payload: OmnichannelChannelUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CHANNELS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelChannelResponse:
    """Update an omnichannel channel."""
    channel = get_omnichannel_channel_or_404(
        db,
        channel_id=channel_id,
        organization_id=current_user.organization_id,
    )
    return update_omnichannel_channel(
        db,
        channel=channel,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_omnichannel_channel_endpoint(
    channel_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CHANNELS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete an omnichannel channel."""
    channel = get_omnichannel_channel_or_404(
        db,
        channel_id=channel_id,
        organization_id=current_user.organization_id,
    )
    delete_omnichannel_channel(db, channel=channel)
