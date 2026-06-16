"""Browser automation profile endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.authorization import require_permission
from app.core.permissions import (
    BROWSER_PROFILES_DELETE,
    BROWSER_PROFILES_READ,
    BROWSER_PROFILES_WRITE,
)
from app.models.user import User
from app.schemas.browser_profile import (
    BrowserProfileCreateRequest,
    BrowserProfileResponse,
    BrowserProfileUpdateRequest,
)
from app.services.browser_profile_service import (
    create_browser_profile,
    delete_browser_profile,
    get_browser_profile_or_404,
    list_browser_profiles,
    update_browser_profile,
)
from app.services.browser_profile_session_service import (
    clear_browser_profile_session,
    profile_has_stored_session,
)

router = APIRouter(prefix="/browser-profiles", tags=["browser-profiles"])


def _serialize_browser_profile(profile) -> BrowserProfileResponse:
    data = BrowserProfileResponse.model_validate(profile)
    return data.model_copy(
        update={"session_stored": profile_has_stored_session(profile)},
    )


@router.post("", response_model=BrowserProfileResponse, status_code=status.HTTP_201_CREATED)
def create_browser_profile_endpoint(
    payload: BrowserProfileCreateRequest,
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserProfileResponse:
    """Create a browser profile for Playwright automation."""
    profile = create_browser_profile(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )
    return _serialize_browser_profile(profile)


@router.get("", response_model=list[BrowserProfileResponse])
def list_browser_profiles_endpoint(
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[BrowserProfileResponse]:
    """List browser profiles in the current organization."""
    profiles = list_browser_profiles(db, organization_id=current_user.organization_id)
    return [_serialize_browser_profile(profile) for profile in profiles]


@router.get("/{profile_id}", response_model=BrowserProfileResponse)
def get_browser_profile_endpoint(
    profile_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserProfileResponse:
    """Get one browser profile by id."""
    profile = get_browser_profile_or_404(
        db,
        profile_id=profile_id,
        organization_id=current_user.organization_id,
    )
    return _serialize_browser_profile(profile)


@router.patch("/{profile_id}", response_model=BrowserProfileResponse)
def update_browser_profile_endpoint(
    profile_id: uuid.UUID,
    payload: BrowserProfileUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserProfileResponse:
    """Update a browser profile."""
    profile = get_browser_profile_or_404(
        db,
        profile_id=profile_id,
        organization_id=current_user.organization_id,
    )
    profile = update_browser_profile(
        db,
        profile=profile,
        organization_id=current_user.organization_id,
        payload=payload,
    )
    return _serialize_browser_profile(profile)


@router.delete("/{profile_id}/session", response_model=BrowserProfileResponse)
def clear_browser_profile_session_endpoint(
    profile_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserProfileResponse:
    """Clear persisted cookies and localStorage for a browser profile."""
    profile = get_browser_profile_or_404(
        db,
        profile_id=profile_id,
        organization_id=current_user.organization_id,
    )
    profile = clear_browser_profile_session(db, profile=profile)
    return _serialize_browser_profile(profile)


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_browser_profile_endpoint(
    profile_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a browser profile."""
    profile = get_browser_profile_or_404(
        db,
        profile_id=profile_id,
        organization_id=current_user.organization_id,
    )
    delete_browser_profile(db, profile=profile)
