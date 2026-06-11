"""Read and update the authenticated user's organization."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.schemas.organization import OrganizationUpdateRequest


def get_organization_or_404(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> Organization:
    organization = db.scalar(
        select(Organization).where(Organization.id == organization_id)
    )
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return organization


def update_organization(
    db: Session,
    *,
    organization: Organization,
    payload: OrganizationUpdateRequest,
) -> Organization:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    if "name" in updates and updates["name"] is not None:
        organization.name = updates["name"]

    if "description" in updates:
        organization.description = updates["description"]

    db.commit()
    db.refresh(organization)
    return organization
