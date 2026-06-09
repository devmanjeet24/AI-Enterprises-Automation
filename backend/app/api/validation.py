"""Shared helpers for translating validation errors to HTTP responses."""

from typing import Any

from fastapi import HTTPException, status
from pydantic import ValidationError


def format_validation_errors(exc: ValidationError) -> list[dict[str, Any]]:
    """Return JSON-serializable validation error details."""
    return [
        {
            "type": error["type"],
            "loc": list(error["loc"]),
            "msg": error["msg"],
        }
        for error in exc.errors()
    ]


def raise_validation_http_exception(exc: ValidationError) -> None:
    """Convert Pydantic validation errors into a FastAPI 422 response."""
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=format_validation_errors(exc),
    ) from exc
