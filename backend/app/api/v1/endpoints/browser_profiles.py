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

router = APIRouter(prefix="/browser-profiles", tags=["browser-profiles"])


@router.post("", response_model=BrowserProfileResponse, status_code=status.HTTP_201_CREATED)
def create_browser_profile_endpoint(
    payload: BrowserProfileCreateRequest,
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserProfileResponse:
    """Create a browser profile for future Playwright automation."""
    return create_browser_profile(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[BrowserProfileResponse])
def list_browser_profiles_endpoint(
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[BrowserProfileResponse]:
    """List browser profiles in the current organization."""
    return list_browser_profiles(db, organization_id=current_user.organization_id)


@router.get("/{profile_id}", response_model=BrowserProfileResponse)
def get_browser_profile_endpoint(
    profile_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_PROFILES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserProfileResponse:
    """Get one browser profile by id."""
    return get_browser_profile_or_404(
        db,
        profile_id=profile_id,
        organization_id=current_user.organization_id,
    )


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
    return update_browser_profile(
        db,
        profile=profile,
        organization_id=current_user.organization_id,
        payload=payload,
    )


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
