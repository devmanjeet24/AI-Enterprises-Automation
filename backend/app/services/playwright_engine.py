"""Playwright-backed browser automation for task execution."""

import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from playwright.sync_api import BrowserContext, Error as PlaywrightError
from playwright.sync_api import sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from app.models.browser_profile import BrowserProfile
from app.schemas.browser_step import BrowserStep, BrowserTaskStepConfig, parse_browser_task_config
from app.services.browser_session_store import get_profile_session_path
from app.services.browser_step_executor import (
    LogCallback,
    StepExecutionError,
    StepExecutionOutcome,
    execute_browser_steps,
)

DEFAULT_NAVIGATION_TIMEOUT_MS = 30_000
DEFAULT_VIEWPORT_WIDTH = 1280
DEFAULT_VIEWPORT_HEIGHT = 720


@dataclass(frozen=True)
class PlaywrightRunResult:
    target_url: str
    final_url: str
    page_title: str
    extracted_text: str
    extracted: dict[str, Any]
    elements_found: int
    steps_completed: int
    step_count: int
    session_loaded: bool
    session_saved: bool


def _profile_locale(profile: BrowserProfile) -> str | None:
    config = profile.config or {}
    locale = config.get("locale")
    return locale if isinstance(locale, str) and locale.strip() else None


def _profile_headless(profile: BrowserProfile) -> bool:
    config = profile.config or {}
    headless = config.get("headless")
    if isinstance(headless, bool):
        return headless
    return True


def _build_context_options(
    profile: BrowserProfile,
    *,
    session_path: Path | None = None,
) -> dict[str, Any]:
    viewport_width = profile.viewport_width or DEFAULT_VIEWPORT_WIDTH
    viewport_height = profile.viewport_height or DEFAULT_VIEWPORT_HEIGHT

    context_options: dict[str, Any] = {
        "viewport": {"width": viewport_width, "height": viewport_height},
    }
    if profile.user_agent:
        context_options["user_agent"] = profile.user_agent

    locale = _profile_locale(profile)
    if locale:
        context_options["locale"] = locale

    if session_path is not None and session_path.is_file():
        context_options["storage_state"] = str(session_path)

    return context_options


def _outcome_to_result(
    outcome: StepExecutionOutcome,
    *,
    session_loaded: bool,
    session_saved: bool,
) -> PlaywrightRunResult:
    return PlaywrightRunResult(
        target_url=outcome.target_url,
        final_url=outcome.final_url,
        page_title=outcome.page_title,
        extracted_text=outcome.extracted_text,
        extracted=outcome.extracted,
        elements_found=outcome.elements_found,
        steps_completed=outcome.steps_completed,
        step_count=outcome.step_count,
        session_loaded=session_loaded,
        session_saved=session_saved,
    )


def _save_context_session(context: BrowserContext, session_path: Path) -> None:
    session_path.parent.mkdir(parents=True, exist_ok=True)
    context.storage_state(path=str(session_path))


def run_playwright_task(
    *,
    profile: BrowserProfile,
    organization_id: uuid.UUID,
    target_url: str,
    steps: list[BrowserStep],
    secrets: dict[str, str],
    task_config: BrowserTaskStepConfig | None = None,
    on_log: LogCallback,
) -> PlaywrightRunResult:
    """Launch Chromium and execute ordered browser automation steps."""
    parsed_config = task_config or BrowserTaskStepConfig()
    viewport_width = profile.viewport_width or DEFAULT_VIEWPORT_WIDTH
    viewport_height = profile.viewport_height or DEFAULT_VIEWPORT_HEIGHT

    session_path: Path | None = None
    session_loaded = False
    if profile.session_persistence_enabled:
        session_path = get_profile_session_path(
            organization_id=organization_id,
            profile_id=profile.id,
        )
        session_loaded = session_path.is_file()

    context_options = _build_context_options(profile, session_path=session_path)

    on_log("info", f"Launching Chromium with profile '{profile.name}'")
    if profile.user_agent:
        on_log("info", f"User-Agent: {profile.user_agent}")
    on_log("info", f"Viewport: {viewport_width}x{viewport_height}")
    on_log("info", f"Executing {len(steps)} step(s)")
    if profile.session_persistence_enabled:
        if session_loaded:
            on_log("info", "Loaded persisted browser session (cookies and localStorage)")
        else:
            on_log("info", "Session persistence enabled; no saved session found yet")

    session_saved = False
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=_profile_headless(profile))
        context = browser.new_context(**context_options)
        page = context.new_page()
        page.set_default_navigation_timeout(parsed_config.navigation_timeout_ms)
        page.set_default_timeout(parsed_config.navigation_timeout_ms)

        try:
            outcome = execute_browser_steps(
                page,
                steps=steps,
                target_url=target_url,
                secrets=secrets,
                navigation_timeout_ms=parsed_config.navigation_timeout_ms,
                wait_until=parsed_config.wait_until,
                on_log=on_log,
            )

            if profile.session_persistence_enabled and session_path is not None:
                _save_context_session(context, session_path)
                session_saved = True
                on_log("info", "Saved browser session for future runs")

            return _outcome_to_result(
                outcome,
                session_loaded=session_loaded,
                session_saved=session_saved,
            )
        finally:
            context.close()
            browser.close()


def format_playwright_error(exc: Exception) -> str:
    if isinstance(exc, StepExecutionError):
        return str(exc)
    if isinstance(exc, PlaywrightTimeoutError):
        return f"Navigation or extraction timed out: {exc}"
    if isinstance(exc, PlaywrightError):
        return f"Browser automation failed: {exc}"
    return str(exc)
