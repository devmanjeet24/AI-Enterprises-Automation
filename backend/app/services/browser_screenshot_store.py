"""Persist failure screenshots for browser task executions."""

import uuid
from pathlib import Path

from app.config import Settings, get_settings


def get_execution_screenshot_path(
    *,
    organization_id: uuid.UUID,
    execution_id: uuid.UUID,
    settings: Settings | None = None,
) -> Path:
    resolved_settings = settings or get_settings()
    root = Path(resolved_settings.browser_screenshot_dir)
    return root / str(organization_id) / f"{execution_id}.png"


def screenshot_exists(
    *,
    organization_id: uuid.UUID,
    execution_id: uuid.UUID,
    settings: Settings | None = None,
) -> bool:
    return get_execution_screenshot_path(
        organization_id=organization_id,
        execution_id=execution_id,
        settings=settings,
    ).is_file()
