"""Department CRUD endpoints — scoped to the authenticated user's organization."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.authorization import require_permission
from app.core.permissions import DEPARTMENTS_DELETE, DEPARTMENTS_READ, DEPARTMENTS_WRITE
from app.core.text import slugify
from app.db.session import get_db
from app.models.department import Department
from app.models.user import User
from app.schemas.department import (
    DepartmentCreateRequest,
    DepartmentResponse,
    DepartmentUpdateRequest,
)

router = APIRouter(prefix="/departments", tags=["departments"])


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department slug must contain at least one letter or number",
        )
    return resolved[:50]


def _get_department_or_404(
    db: Session,
    *,
    department_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Department:
    department = db.scalar(
        select(Department).where(
            Department.id == department_id,
            Department.organization_id == organization_id,
        )
    )
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )
    return department


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_department_id: uuid.UUID | None = None,
) -> None:
    query = select(Department.id).where(
        Department.organization_id == organization_id,
        Department.slug == slug,
    )
    if exclude_department_id is not None:
        query = query.where(Department.id != exclude_department_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Department slug '{slug}' is already taken in this organization",
        )


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreateRequest,
    current_user: Annotated[User, Depends(require_permission(DEPARTMENTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> Department:
    """Create a department inside the current user's organization."""
    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=current_user.organization_id, slug=slug)

    department = Department(
        organization_id=current_user.organization_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
    )
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


@router.get("", response_model=list[DepartmentResponse])
def list_departments(
    current_user: Annotated[User, Depends(require_permission(DEPARTMENTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[Department]:
    """List all departments in the current user's organization."""
    return list(
        db.scalars(
            select(Department)
            .where(Department.organization_id == current_user.organization_id)
            .order_by(Department.name)
        ).all()
    )


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(DEPARTMENTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> Department:
    """Get one department by id within the current organization."""
    return _get_department_or_404(
        db,
        department_id=department_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: uuid.UUID,
    payload: DepartmentUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(DEPARTMENTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> Department:
    """Update a department in the current organization."""
    department = _get_department_or_404(
        db,
        department_id=department_id,
        organization_id=current_user.organization_id,
    )

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    if "name" in updates:
        department.name = updates["name"]

    if "description" in updates:
        department.description = updates["description"]

    if "is_active" in updates:
        department.is_active = updates["is_active"]

    if "slug" in updates:
        slug = _resolve_slug(updates.get("name", department.name), updates["slug"])
        _ensure_unique_slug(
            db,
            organization_id=current_user.organization_id,
            slug=slug,
            exclude_department_id=department.id,
        )
        department.slug = slug
    elif "name" in updates and payload.slug is None:
        # Keep slug stable when only the display name changes.
        pass

    db.commit()
    db.refresh(department)
    return department


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(DEPARTMENTS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a department from the current organization."""
    department = _get_department_or_404(
        db,
        department_id=department_id,
        organization_id=current_user.organization_id,
    )
    db.delete(department)
    db.commit()
