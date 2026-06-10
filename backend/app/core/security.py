"""Security helpers: password hashing and JWT tokens."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import bcrypt
from jose import jwt

from app.config import get_settings


def hash_password(password: str) -> str:
    """Return a bcrypt hash — never store plain-text passwords."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a plain password against its stored hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )


def create_access_token(
    *,
    user_id: UUID,
    email: str,
    organization_id: UUID,
    roles: list[str],
    expires_delta: timedelta | None = None,
) -> str:
    """Build a signed JWT containing identity and role slugs."""
    settings = get_settings()
    expire = datetime.now(UTC) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "organization_id": str(organization_id),
        "roles": roles,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises JWTError if invalid or expired."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
