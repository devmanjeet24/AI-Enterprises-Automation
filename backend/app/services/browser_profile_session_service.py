"""Browser profile session management."""

import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.browser_profile import BrowserProfile
from app.services.browser_session_store import clear_profile_session, session_file_exists


def profile_has_stored_session(profile: BrowserProfile) -> bool:
    return session_file_exists(
        organization_id=profile.organization_id,
        profile_id=profile.id,
    )


def clear_browser_profile_session(db: Session, *, profile: BrowserProfile) -> BrowserProfile:
    removed = clear_profile_session(
        organization_id=profile.organization_id,
        profile_id=profile.id,
    )
    if removed or profile.session_updated_at is not None:
        profile.session_updated_at = None
        db.commit()
        db.refresh(profile)
    return profile


def mark_profile_session_saved(db: Session, *, profile: BrowserProfile) -> None:
    profile.session_updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(profile)


def delete_profile_session_files(profile: BrowserProfile) -> None:
    clear_profile_session(
        organization_id=profile.organization_id,
        profile_id=profile.id,
    )


def sync_profile_session_on_update(
    db: Session,
    *,
    profile: BrowserProfile,
    session_persistence_enabled: bool | None,
) -> None:
    if session_persistence_enabled is False:
        clear_browser_profile_session(db, profile=profile)
