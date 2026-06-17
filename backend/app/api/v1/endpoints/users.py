"""User management endpoints — scoped to the authenticated user's organization."""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.core.authorization import get_user_permission_slugs, require_permission
from app.core.permissions import USERS_ASSIGN_ROLE, USERS_READ, USERS_WRITE
from app.core.security import create_access_token, hash_password
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.models.user_invitation import UserInvitation
from app.models.user_role import UserRole
from app.schemas.auth import RoleSummary, TokenResponse
from app.schemas.user import (
    UserCreateRequest,
    UserInvitationAcceptRequest,
    UserInvitationResponse,
    UserInviteRequest,
    UserResponse,
    UserRoleAssignRequest,
    UserRoleAssignmentResponse,
    UserUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["users"])

INVITATION_TTL_DAYS = 7


def _build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        organization_id=user.organization_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        roles=[RoleSummary.model_validate(role) for role in user.roles],
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _get_user_or_404(
    db: Session,
    *,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> User:
    user = db.scalar(
        select(User)
        .where(
            User.id == user_id,
            User.organization_id == organization_id,
        )
        .options(selectinload(User.roles))
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def _get_role_or_404(
    db: Session,
    *,
    role_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Role:
    role = db.scalar(
        select(Role).where(
            Role.id == role_id,
            Role.organization_id == organization_id,
        )
    )
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return role


def _get_default_member_role(db: Session, *, organization_id: uuid.UUID) -> Role:
    role = db.scalar(
        select(Role).where(
            Role.organization_id == organization_id,
            Role.slug == "member",
            Role.is_active.is_(True),
        )
    )
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization has no active member role configured",
        )
    return role


def _resolve_create_role(
    db: Session,
    *,
    organization_id: uuid.UUID,
    role_id: uuid.UUID | None,
) -> Role:
    role = (
        _get_role_or_404(db, role_id=role_id, organization_id=organization_id)
        if role_id is not None
        else _get_default_member_role(db, organization_id=organization_id)
    )
    if not role.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign an inactive role",
        )
    return role


def _get_invitation_or_404(
    db: Session,
    *,
    invitation_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> UserInvitation:
    invitation = db.scalar(
        select(UserInvitation)
        .where(
            UserInvitation.id == invitation_id,
            UserInvitation.organization_id == organization_id,
        )
        .options(selectinload(UserInvitation.role))
    )
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    return invitation


def _find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


def _find_pending_invitation(
    db: Session,
    *,
    organization_id: uuid.UUID,
    email: str,
) -> UserInvitation | None:
    return db.scalar(
        select(UserInvitation).where(
            UserInvitation.organization_id == organization_id,
            func.lower(UserInvitation.email) == email.lower(),
            UserInvitation.accepted_at.is_(None),
        )
    )


def _generate_invitation_token() -> str:
    return secrets.token_urlsafe(32)


def _hash_invitation_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _build_invite_url(token: str) -> str:
    settings = get_settings()
    return f"{settings.frontend_url.rstrip('/')}/accept-invitation?{urlencode({'token': token})}"


def _build_invitation_response(
    invitation: UserInvitation,
    *,
    invite_url: str | None = None,
) -> UserInvitationResponse:
    return UserInvitationResponse(
        id=invitation.id,
        organization_id=invitation.organization_id,
        email=invitation.email,
        first_name=invitation.first_name,
        last_name=invitation.last_name,
        role=RoleSummary.model_validate(invitation.role),
        invited_by_id=invitation.invited_by_id,
        accepted_by_id=invitation.accepted_by_id,
        invite_url=invite_url,
        expires_at=invitation.expires_at,
        accepted_at=invitation.accepted_at,
        created_at=invitation.created_at,
        updated_at=invitation.updated_at,
    )


def _load_user_with_roles(db: Session, user_id: uuid.UUID) -> User:
    user = db.scalar(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.roles))
    )
    assert user is not None
    return user


def _build_token_for_user(user: User) -> TokenResponse:
    role_slugs = [role.slug for role in user.roles]
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        organization_id=user.organization_id,
        roles=role_slugs,
    )
    return TokenResponse(access_token=access_token)


def _count_active_admins(db: Session, *, organization_id: uuid.UUID) -> int:
    """Count active users who hold the admin role in this organization."""
    return db.scalar(
        select(func.count(func.distinct(User.id)))
        .select_from(User)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(
            User.organization_id == organization_id,
            User.is_active.is_(True),
            Role.organization_id == organization_id,
            Role.slug == "admin",
            Role.is_active.is_(True),
        )
    ) or 0


def _user_has_role_slug(user: User, role_slug: str) -> bool:
    return any(role.slug == role_slug for role in user.roles)


def _ensure_not_last_admin(
    db: Session,
    *,
    organization_id: uuid.UUID,
    target_user: User,
    will_remain_admin: bool,
) -> None:
    if will_remain_admin:
        return
    if not _user_has_role_slug(target_user, "admin"):
        return
    if _count_active_admins(db, organization_id=organization_id) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the last active administrator from the organization",
        )


def _ensure_can_assign_role_on_create(
    db: Session,
    *,
    current_user: User,
    role_id: uuid.UUID | None,
) -> None:
    """Creating or inviting with an explicit role requires users:assign-role."""
    if role_id is None:
        return

    permission_slugs = get_user_permission_slugs(db, current_user)
    if USERS_ASSIGN_ROLE not in permission_slugs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission '{USERS_ASSIGN_ROLE}' required to assign a role",
        )


@router.get("", response_model=list[UserResponse])
def list_users(
    current_user: Annotated[User, Depends(require_permission(USERS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[UserResponse]:
    """List all users in the current organization."""
    users = list(
        db.scalars(
            select(User)
            .where(User.organization_id == current_user.organization_id)
            .options(selectinload(User.roles))
            .order_by(User.last_name, User.first_name)
        ).all()
    )
    return [_build_user_response(user) for user in users]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    current_user: Annotated[User, Depends(require_permission(USERS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Create an active user directly in the current organization."""
    existing_user = _find_user_by_email(db, payload.email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    _ensure_can_assign_role_on_create(
        db,
        current_user=current_user,
        role_id=payload.role_id,
    )
    role = _resolve_create_role(
        db,
        organization_id=current_user.organization_id,
        role_id=payload.role_id,
    )
    user = User(
        organization_id=current_user.organization_id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(user)
    db.flush()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    db.commit()

    loaded = _get_user_or_404(db, user_id=user.id, organization_id=current_user.organization_id)
    return _build_user_response(loaded)


@router.get("/invitations", response_model=list[UserInvitationResponse])
def list_invitations(
    current_user: Annotated[User, Depends(require_permission(USERS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[UserInvitationResponse]:
    """List invitations for the current organization."""
    invitations = list(
        db.scalars(
            select(UserInvitation)
            .where(UserInvitation.organization_id == current_user.organization_id)
            .options(selectinload(UserInvitation.role))
            .order_by(UserInvitation.created_at.desc())
        ).all()
    )
    return [_build_invitation_response(invitation) for invitation in invitations]


@router.post(
    "/invitations",
    response_model=UserInvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_user(
    payload: UserInviteRequest,
    current_user: Annotated[User, Depends(require_permission(USERS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> UserInvitationResponse:
    """Create a pending invitation for a user to join the current organization."""
    existing_user = _find_user_by_email(db, payload.email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    existing_invitation = _find_pending_invitation(
        db,
        organization_id=current_user.organization_id,
        email=payload.email,
    )
    if existing_invitation is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active invitation already exists for this email. Resend it instead.",
        )

    _ensure_can_assign_role_on_create(
        db,
        current_user=current_user,
        role_id=payload.role_id,
    )
    role = _resolve_create_role(
        db,
        organization_id=current_user.organization_id,
        role_id=payload.role_id,
    )
    token = _generate_invitation_token()
    invitation = UserInvitation(
        organization_id=current_user.organization_id,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role_id=role.id,
        invited_by_id=current_user.id,
        token_hash=_hash_invitation_token(token),
        expires_at=datetime.now(UTC) + timedelta(days=INVITATION_TTL_DAYS),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    loaded = _get_invitation_or_404(
        db,
        invitation_id=invitation.id,
        organization_id=current_user.organization_id,
    )
    return _build_invitation_response(loaded, invite_url=_build_invite_url(token))


@router.post("/invitations/{invitation_id}/resend", response_model=UserInvitationResponse)
def resend_invitation(
    invitation_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(USERS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> UserInvitationResponse:
    """Refresh the one-time token for a pending invitation."""
    invitation = _get_invitation_or_404(
        db,
        invitation_id=invitation_id,
        organization_id=current_user.organization_id,
    )
    if invitation.accepted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot resend an accepted invitation",
        )

    token = _generate_invitation_token()
    invitation.token_hash = _hash_invitation_token(token)
    invitation.expires_at = datetime.now(UTC) + timedelta(days=INVITATION_TTL_DAYS)
    invitation.invited_by_id = current_user.id
    db.commit()
    db.refresh(invitation)
    loaded = _get_invitation_or_404(
        db,
        invitation_id=invitation.id,
        organization_id=current_user.organization_id,
    )
    return _build_invitation_response(loaded, invite_url=_build_invite_url(token))


@router.post("/invitations/accept", response_model=TokenResponse)
def accept_invitation(
    payload: UserInvitationAcceptRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Accept an invitation, create the user, and return a login token."""
    token = payload.token.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token is required",
        )

    invitation = db.scalar(
        select(UserInvitation)
        .where(UserInvitation.token_hash == _hash_invitation_token(token))
        .options(selectinload(UserInvitation.role))
    )
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    if invitation.accepted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been accepted",
        )
    if invitation.expires_at < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired",
        )
    if _find_user_by_email(db, invitation.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    first_name = payload.first_name or invitation.first_name
    last_name = payload.last_name or invitation.last_name
    if first_name is None or last_name is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="First name and last name are required to accept this invitation",
        )

    user = User(
        organization_id=invitation.organization_id,
        email=invitation.email,
        password_hash=hash_password(payload.password),
        first_name=first_name,
        last_name=last_name,
    )
    db.add(user)
    db.flush()
    db.add(UserRole(user_id=user.id, role_id=invitation.role_id))
    invitation.accepted_at = datetime.now(UTC)
    invitation.accepted_by_id = user.id
    db.commit()

    loaded_user = _load_user_with_roles(db, user.id)
    return _build_token_for_user(loaded_user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(USERS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Get one user by id within the current organization."""
    user = _get_user_or_404(
        db,
        user_id=user_id,
        organization_id=current_user.organization_id,
    )
    return _build_user_response(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(USERS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Update a user profile or deactivate the account (is_active=false)."""
    user = _get_user_or_404(
        db,
        user_id=user_id,
        organization_id=current_user.organization_id,
    )

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    if updates.get("is_active") is False:
        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account",
            )
        _ensure_not_last_admin(
            db,
            organization_id=current_user.organization_id,
            target_user=user,
            will_remain_admin=False,
        )

    if "first_name" in updates:
        user.first_name = updates["first_name"]

    if "last_name" in updates:
        user.last_name = updates["last_name"]

    if "is_active" in updates:
        user.is_active = updates["is_active"]

    db.commit()
    db.refresh(user)
    loaded = _get_user_or_404(
        db,
        user_id=user.id,
        organization_id=current_user.organization_id,
    )
    return _build_user_response(loaded)


@router.post(
    "/{user_id}/roles",
    response_model=UserRoleAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_role_to_user(
    user_id: uuid.UUID,
    payload: UserRoleAssignRequest,
    current_user: Annotated[User, Depends(require_permission(USERS_ASSIGN_ROLE))],
    db: Annotated[Session, Depends(get_db)],
) -> UserRoleAssignmentResponse:
    """Grant a role to a user within the current organization."""
    user = _get_user_or_404(
        db,
        user_id=user_id,
        organization_id=current_user.organization_id,
    )
    role = _get_role_or_404(
        db,
        role_id=payload.role_id,
        organization_id=current_user.organization_id,
    )

    if not role.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign an inactive role",
        )

    existing = db.scalar(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role is already assigned to this user",
        )

    link = UserRole(user_id=user.id, role_id=role.id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return UserRoleAssignmentResponse(
        id=link.id,
        user_id=link.user_id,
        role_id=link.role_id,
        role_slug=role.slug,
        role_name=role.name,
        created_at=link.created_at,
    )


@router.delete(
    "/{user_id}/roles/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_role_from_user(
    user_id: uuid.UUID,
    role_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(USERS_ASSIGN_ROLE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Revoke a role from a user within the current organization."""
    user = _get_user_or_404(
        db,
        user_id=user_id,
        organization_id=current_user.organization_id,
    )
    role = _get_role_or_404(
        db,
        role_id=role_id,
        organization_id=current_user.organization_id,
    )

    if role.slug == "admin":
        still_admin = any(
            assigned_role.slug == "admin" and assigned_role.id != role.id
            for assigned_role in user.roles
        )
        _ensure_not_last_admin(
            db,
            organization_id=current_user.organization_id,
            target_user=user,
            will_remain_admin=still_admin,
        )

    link = db.scalar(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
        )
    )
    if link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role assignment not found for this user",
        )

    db.delete(link)
    db.commit()
