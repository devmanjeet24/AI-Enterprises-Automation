"""Persist Playwright storage_state per browser profile."""

import uuid
from pathlib import Path

from app.config import Settings, get_settings


def get_profile_session_path(
    *,
    organization_id: uuid.UUID,
    profile_id: uuid.UUID,
    settings: Settings | None = None,
) -> Path:
    resolved_settings = settings or get_settings()
    root = Path(resolved_settings.browser_session_dir)
    return root / str(organization_id) / f"{profile_id}.json"


def session_file_exists(
    *,
    organization_id: uuid.UUID,
    profile_id: uuid.UUID,
    settings: Settings | None = None,
) -> bool:
    return get_profile_session_path(
        organization_id=organization_id,
        profile_id=profile_id,
        settings=settings,
    ).is_file()


def clear_profile_session(
    *,
    organization_id: uuid.UUID,
    profile_id: uuid.UUID,
    settings: Settings | None = None,
) -> bool:
    """Delete persisted storage_state for a profile. Returns True if a file was removed."""
    path = get_profile_session_path(
        organization_id=organization_id,
        profile_id=profile_id,
        settings=settings,
    )
    if not path.is_file():
        return False
    path.unlink()
    return True
