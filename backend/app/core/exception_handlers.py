"""Centralized API exception handlers for database and infrastructure errors."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

# Friendly messages for known PostgreSQL unique / FK constraint names.
CONSTRAINT_MESSAGES: dict[str, str] = {
    "organizations_slug_key": "Organization slug is already taken",
    "uq_departments_organization_id_slug": (
        "Department slug is already taken in this organization"
    ),
    "uq_teams_department_id_slug": "Team slug is already taken in this department",
    "uq_roles_organization_id_slug": "Role slug is already taken in this organization",
    "uq_permissions_organization_id_slug": (
        "Permission slug is already taken in this organization"
    ),
    "uq_user_roles_user_id_role_id": "This role is already assigned to the user",
    "uq_role_permissions_role_id_permission_id": (
        "This permission is already assigned to the role"
    ),
    "ix_users_email": "A user with this email already exists",
    "users_email_key": "A user with this email already exists",
}

PGCODE_MESSAGES: dict[str, tuple[int, str]] = {
    "23505": (status.HTTP_409_CONFLICT, "A record with this value already exists"),
    "23503": (
        status.HTTP_409_CONFLICT,
        "Cannot complete operation because related records exist",
    ),
    "23502": (status.HTTP_400_BAD_REQUEST, "A required field is missing"),
    "23514": (status.HTTP_400_BAD_REQUEST, "A value violates a database constraint"),
}


def _constraint_name_from_error(exc: IntegrityError) -> str | None:
    orig = exc.orig
    diag = getattr(orig, "diag", None)
    if diag is not None:
        name = getattr(diag, "constraint_name", None)
        if name:
            return name

    message = str(orig)
    if "unique constraint" in message or "violates unique constraint" in message:
        marker = 'constraint "'
        start = message.find(marker)
        if start != -1:
            start += len(marker)
            end = message.find('"', start)
            if end != -1:
                return message[start:end]
    return None


def integrity_error_response(exc: IntegrityError) -> JSONResponse:
    """Map a SQLAlchemy IntegrityError to a user-friendly JSON response."""
    orig = exc.orig
    pgcode = getattr(orig, "pgcode", None)
    constraint_name = _constraint_name_from_error(exc)

    if constraint_name and constraint_name in CONSTRAINT_MESSAGES:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": CONSTRAINT_MESSAGES[constraint_name]},
        )

    if pgcode and pgcode in PGCODE_MESSAGES:
        status_code, detail = PGCODE_MESSAGES[pgcode]
        return JSONResponse(
            status_code=status_code,
            content={"detail": detail},
        )

    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "The request conflicts with existing data"},
    )


async def integrity_error_handler(_request: Request, exc: IntegrityError) -> JSONResponse:
    """FastAPI handler for unhandled SQLAlchemy integrity violations."""
    return integrity_error_response(exc)


def register_exception_handlers(app: FastAPI) -> None:
    """Attach shared exception handlers to the FastAPI application."""
    app.add_exception_handler(IntegrityError, integrity_error_handler)
