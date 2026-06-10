"""Authentication endpoints: register, login, and current user."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import CurrentUser
from app.api.validation import raise_validation_http_exception
from app.core.permissions import seed_organization_permissions
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.auth import (
    LoginRequest,
    RoleSummary,
    TokenResponse,
    UserMeResponse,
    UserRegisterRequest,
)
from app.core.text import slugify

router = APIRouter(prefix="/auth", tags=["auth"])

DEFAULT_ROLES: tuple[tuple[str, str, str], ...] = (
    ("Administrator", "admin", "Full platform access"),
    ("Manager", "manager", "Manage teams and workflows"),
    ("Member", "member", "Standard employee access"),
)


def _create_default_roles(db: Session, organization_id: uuid.UUID) -> dict[str, Role]:
    """Create the standard role set for a new organization."""
    roles: dict[str, Role] = {}
    for name, slug, description in DEFAULT_ROLES:
        role = Role(
            organization_id=organization_id,
            name=name,
            slug=slug,
            description=description,
        )
        db.add(role)
        roles[slug] = role
    db.flush()
    return roles


def _assign_role(db: Session, user: User, role: Role) -> None:
    db.add(UserRole(user_id=user.id, role_id=role.id))


def _load_user(db: Session, user_id: uuid.UUID) -> User | None:
    return db.scalar(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.roles), selectinload(User.organization))
    )


def _build_token_for_user(user: User) -> TokenResponse:
    role_slugs = [role.slug for role in user.roles]
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        organization_id=user.organization_id,
        roles=role_slugs,
    )
    return TokenResponse(access_token=access_token)


def _build_me_response(user: User) -> UserMeResponse:
    return UserMeResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        organization_id=user.organization_id,
        organization_name=user.organization.name,
        organization_slug=user.organization.slug,
        is_active=user.is_active,
        roles=[RoleSummary.model_validate(role) for role in user.roles],
        created_at=user.created_at,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegisterRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Register a new user — either create a company or join an existing one."""
    existing_user = db.scalar(select(User).where(User.email == payload.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    if payload.organization_name:
        slug = slugify(payload.organization_name)
        if not slug:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization name must contain at least one letter or number",
            )

        existing_org = db.scalar(select(Organization).where(Organization.slug == slug))
        if existing_org is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Organization slug '{slug}' is already taken",
            )

        organization = Organization(
            name=payload.organization_name,
            slug=slug,
        )
        db.add(organization)
        db.flush()

        roles = _create_default_roles(db, organization.id)
        seed_organization_permissions(db, organization.id, roles)
        assigned_role = roles["admin"]
    else:
        organization = db.scalar(
            select(Organization).where(Organization.slug == payload.organization_slug)
        )
        if organization is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )
        if not organization.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization is not active",
            )

        assigned_role = db.scalar(
            select(Role).where(
                Role.organization_id == organization.id,
                Role.slug == "member",
                Role.is_active.is_(True),
            )
        )
        if assigned_role is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization has no member role configured",
            )

    user = User(
        organization_id=organization.id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(user)
    db.flush()

    _assign_role(db, user, assigned_role)
    db.commit()

    loaded_user = _load_user(db, user.id)
    assert loaded_user is not None
    return _build_token_for_user(loaded_user)


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Login with email (username field) and password. Returns a JWT."""
    try:
        credentials = LoginRequest.from_form(form_data.username, form_data.password)
    except ValidationError as exc:
        raise_validation_http_exception(exc)

    user = db.scalar(
        select(User)
        .where(User.email == credentials.email)
        .options(selectinload(User.roles), selectinload(User.organization))
    )
    if user is None or user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return _build_token_for_user(user)


@router.get("/me", response_model=UserMeResponse)
def read_current_user(current_user: CurrentUser) -> UserMeResponse:
    """Return the currently authenticated user's profile and roles."""
    return _build_me_response(current_user)
