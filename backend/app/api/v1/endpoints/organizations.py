"""Organization profile endpoints for the authenticated tenant."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.core.authorization import require_permission
from app.core.permissions import ORGANIZATIONS_READ, ORGANIZATIONS_WRITE
from app.schemas.organization import OrganizationResponse, OrganizationUpdateRequest
from app.services.organization_service import get_organization_or_404, update_organization

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/me", response_model=OrganizationResponse)
def read_current_organization(
    current_user: Annotated[CurrentUser, Depends(require_permission(ORGANIZATIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> OrganizationResponse:
    """Return the authenticated user's organization."""
    return get_organization_or_404(db, organization_id=current_user.organization_id)


@router.patch("/me", response_model=OrganizationResponse)
def update_current_organization(
    payload: OrganizationUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(require_permission(ORGANIZATIONS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> OrganizationResponse:
    """Update organization settings. Requires organizations:write permission."""
    organization = get_organization_or_404(db, organization_id=current_user.organization_id)
    return update_organization(db, organization=organization, payload=payload)
