"""Execute ordered browser automation steps with Playwright."""

from dataclasses import dataclass, field
from typing import Any, Callable

from playwright.sync_api import Page
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from app.schemas.browser_step import (
    BrowserExtractSelector,
    BrowserStep,
    BrowserStepClick,
    BrowserStepExtract,
    BrowserStepFill,
    BrowserStepGoto,
    BrowserStepWaitForSelector,
    substitute_template,
)

LogCallback = Callable[[str, str], None]


@dataclass
class StepExecutionError(Exception):
    step_index: int
    step_action: str
    message: str
    selector: str | None = None

    def __str__(self) -> str:
        location = f"step {self.step_index + 1} ({self.step_action})"
        if self.selector:
            location = f"{location} selector '{self.selector}'"
        return f"{location}: {self.message}"


@dataclass
class StepExecutionOutcome:
    target_url: str
    final_url: str
    page_title: str
    extracted: dict[str, Any] = field(default_factory=dict)
    extracted_text: str = ""
    elements_found: int = 0
    steps_completed: int = 0
    step_count: int = 0


def _resolve_timeout(step_timeout_ms: int | None, default_timeout_ms: int) -> int:
    return step_timeout_ms if step_timeout_ms is not None else default_timeout_ms


def _locator(page: Page, selector_spec: BrowserExtractSelector):
    if selector_spec.type == "xpath":
        return page.locator(f"xpath={selector_spec.selector}")
    return page.locator(selector_spec.selector)


def _read_selector_value(page: Page, selector_spec: BrowserExtractSelector, timeout_ms: int) -> Any:
    locator = _locator(page, selector_spec)
    attribute = selector_spec.attribute

    if selector_spec.multiple:
        count = locator.count()
        values: list[Any] = []
        for index in range(count):
            item = locator.nth(index)
            values.append(_read_locator_value(item, attribute, timeout_ms))
        return values

    return _read_locator_value(locator, attribute, timeout_ms)


def _read_locator_value(locator, attribute: str | None, timeout_ms: int) -> Any:
    if attribute in (None, "text"):
        return " ".join(locator.inner_text(timeout=timeout_ms).split())
    if attribute == "value":
        return locator.input_value(timeout=timeout_ms)
    if attribute == "checked":
        return locator.is_checked(timeout=timeout_ms)
    if attribute == "html":
        return locator.inner_html(timeout=timeout_ms)
    return locator.get_attribute(attribute, timeout=timeout_ms)


def _extract_values(
    page: Page,
    selectors: list[BrowserExtractSelector],
    *,
    default_timeout_ms: int,
    on_log: LogCallback,
) -> dict[str, Any]:
    extracted: dict[str, Any] = {}
    for selector_spec in selectors:
        value = _read_selector_value(page, selector_spec, default_timeout_ms)
        extracted[selector_spec.name] = value
        on_log(
            "info",
            f"Extracted '{selector_spec.name}' using {selector_spec.type} selector '{selector_spec.selector}'",
        )
    return extracted


def _describe_step(step: BrowserStep) -> str:
    if isinstance(step, BrowserStepGoto):
        return f"goto {step.url or '{{target_url}}'}"
    if isinstance(step, BrowserStepWaitForSelector):
        return f"wait_for_selector {step.selector}"
    if isinstance(step, BrowserStepClick):
        return f"click {step.selector}"
    if isinstance(step, BrowserStepFill):
        return f"fill {step.selector}"
    return f"extract ({len(step.selectors)} selector(s))"


def execute_browser_steps(
    page: Page,
    *,
    steps: list[BrowserStep],
    target_url: str,
    secrets: dict[str, str],
    navigation_timeout_ms: int,
    wait_until: str,
    on_log: LogCallback,
) -> StepExecutionOutcome:
    """Run steps sequentially; stop and raise StepExecutionError on the first failure."""
    outcome = StepExecutionOutcome(
        target_url=target_url,
        final_url=page.url,
        page_title="",
        step_count=len(steps),
    )

    for index, step in enumerate(steps):
        step_label = f"Step {index + 1}/{len(steps)}: {_describe_step(step)}"
        on_log("info", step_label)

        try:
            if isinstance(step, BrowserStepGoto):
                url = substitute_template(
                    step.url or "{{target_url}}",
                    target_url=target_url,
                    secrets=secrets,
                )
                response = page.goto(url, wait_until=wait_until, timeout=navigation_timeout_ms)
                outcome.target_url = url
                if response is not None:
                    on_log("info", f"HTTP status: {response.status}")
                on_log("info", f"Navigated to {page.url}")

            elif isinstance(step, BrowserStepWaitForSelector):
                timeout_ms = _resolve_timeout(step.timeout_ms, navigation_timeout_ms)
                page.wait_for_selector(
                    step.selector,
                    state=step.state,
                    timeout=timeout_ms,
                )
                on_log("info", f"Selector visible: {step.selector}")

            elif isinstance(step, BrowserStepClick):
                timeout_ms = _resolve_timeout(step.timeout_ms, navigation_timeout_ms)
                page.locator(step.selector).click(timeout=timeout_ms)
                on_log("info", f"Clicked: {step.selector}")

            elif isinstance(step, BrowserStepFill):
                timeout_ms = _resolve_timeout(step.timeout_ms, navigation_timeout_ms)
                fill_value = substitute_template(step.value, target_url=target_url, secrets=secrets)
                page.locator(step.selector).fill(fill_value, timeout=timeout_ms)
                on_log("info", f"Filled: {step.selector}")

            elif isinstance(step, BrowserStepExtract):
                timeout_ms = navigation_timeout_ms
                extracted = _extract_values(
                    page,
                    step.selectors,
                    default_timeout_ms=timeout_ms,
                    on_log=on_log,
                )
                outcome.extracted = extracted
                body_text = extracted.get("body_text")
                if isinstance(body_text, str):
                    outcome.extracted_text = body_text
                else:
                    outcome.extracted_text = " ".join(
                        str(value) for value in extracted.values() if value is not None
                    )
                outcome.elements_found = page.locator("a").count()

            outcome.steps_completed = index + 1
            outcome.final_url = page.url
            outcome.page_title = page.title()

        except ValueError as exc:
            selector = step.selector if hasattr(step, "selector") else None
            raise StepExecutionError(
                step_index=index,
                step_action=step.action,
                message=str(exc),
                selector=selector,
            ) from exc
        except PlaywrightTimeoutError as exc:
            selector = step.selector if hasattr(step, "selector") else None
            raise StepExecutionError(
                step_index=index,
                step_action=step.action,
                message=f"Timed out: {exc}",
                selector=selector,
            ) from exc
        except Exception as exc:
            selector = step.selector if hasattr(step, "selector") else None
            raise StepExecutionError(
                step_index=index,
                step_action=step.action,
                message=str(exc),
                selector=selector,
            ) from exc

    if not outcome.page_title:
        outcome.page_title = page.title()
    if not outcome.extracted_text and outcome.extracted:
        outcome.extracted_text = " ".join(
            str(value) for value in outcome.extracted.values() if value is not None
        )

    return outcome
