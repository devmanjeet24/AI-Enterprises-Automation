"""Organization profile endpoints for the authenticated tenant."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.models.user import User
from app.schemas.organization import OrganizationResponse, OrganizationUpdateRequest
from app.services.organization_service import get_organization_or_404, update_organization

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _user_is_admin(user: User) -> bool:
    return any(role.slug == "admin" and role.is_active for role in user.roles)


@router.get("/me", response_model=OrganizationResponse)
def read_current_organization(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> OrganizationResponse:
    """Return the authenticated user's organization."""
    return get_organization_or_404(db, organization_id=current_user.organization_id)


@router.patch("/me", response_model=OrganizationResponse)
def update_current_organization(
    payload: OrganizationUpdateRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> OrganizationResponse:
    """Update organization settings. Requires the administrator role."""
    if not _user_is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator role required to update organization settings",
        )

    organization = get_organization_or_404(db, organization_id=current_user.organization_id)
    return update_organization(db, organization=organization, payload=payload)
