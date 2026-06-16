"""Pydantic schemas for browser automation task steps."""

import re
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, TypeAdapter, field_validator, model_validator

BrowserStepAction = Literal["goto", "wait_for_selector", "click", "fill", "extract"]
SECRET_KEY_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")


class BrowserExtractSelector(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    selector: str = Field(min_length=1, max_length=512)
    type: Literal["css", "xpath"] = "css"
    multiple: bool = False
    attribute: str | None = Field(default=None, max_length=64)


class BrowserStepGoto(BaseModel):
    action: Literal["goto"] = "goto"
    url: str | None = Field(default=None, max_length=2048)


class BrowserStepWaitForSelector(BaseModel):
    action: Literal["wait_for_selector"] = "wait_for_selector"
    selector: str = Field(min_length=1, max_length=512)
    timeout_ms: int | None = Field(default=None, ge=100, le=300_000)
    state: Literal["attached", "detached", "hidden", "visible"] = "visible"


class BrowserStepClick(BaseModel):
    action: Literal["click"] = "click"
    selector: str = Field(min_length=1, max_length=512)
    timeout_ms: int | None = Field(default=None, ge=100, le=300_000)


class BrowserStepFill(BaseModel):
    action: Literal["fill"] = "fill"
    selector: str = Field(min_length=1, max_length=512)
    value: str = Field(max_length=4096)
    timeout_ms: int | None = Field(default=None, ge=100, le=300_000)


class BrowserStepExtract(BaseModel):
    action: Literal["extract"] = "extract"
    selectors: list[BrowserExtractSelector] = Field(default_factory=list)

    @field_validator("selectors")
    @classmethod
    def validate_selectors_not_empty(cls, value: list[BrowserExtractSelector]) -> list[BrowserExtractSelector]:
        if not value:
            raise ValueError("extract step requires at least one selector")
        names = [item.name for item in value]
        if len(names) != len(set(names)):
            raise ValueError("extract selector names must be unique")
        return value


BrowserStep = Annotated[
    BrowserStepGoto
    | BrowserStepWaitForSelector
    | BrowserStepClick
    | BrowserStepFill
    | BrowserStepExtract,
    Field(discriminator="action"),
]

_browser_step_adapter = TypeAdapter(BrowserStep)


class BrowserTaskStepConfig(BaseModel):
    navigation_timeout_ms: int = Field(default=30_000, ge=1_000, le=300_000)
    wait_until: Literal["commit", "domcontentloaded", "load", "networkidle"] = "domcontentloaded"
    steps: list[BrowserStep] = Field(default_factory=list)
    secrets: dict[str, str] | None = None

    @field_validator("secrets")
    @classmethod
    def validate_secrets(cls, value: dict[str, str] | None) -> dict[str, str] | None:
        if value is None:
            return None
        validated: dict[str, str] = {}
        for key, secret_value in value.items():
            if not isinstance(key, str) or not SECRET_KEY_PATTERN.match(key):
                raise ValueError(
                    "Secret keys must contain only letters, numbers, and underscores"
                )
            if not isinstance(secret_value, str):
                raise ValueError(f"Secret '{key}' must be a string")
            validated[key] = secret_value
        return validated

    @model_validator(mode="after")
    def validate_step_actions(self) -> "BrowserTaskStepConfig":
        for index, step in enumerate(self.steps):
            if step.action == "extract" and index < len(self.steps) - 1:
                raise ValueError("extract step must be the final step in the sequence")
        return self


def parse_browser_task_config(config: dict[str, Any] | None) -> BrowserTaskStepConfig:
    """Parse and validate browser task config including ordered steps."""
    if not config:
        return BrowserTaskStepConfig()
    return BrowserTaskStepConfig.model_validate(config)


def parse_browser_step(step_data: dict[str, Any]) -> BrowserStep:
    """Parse a single step dictionary."""
    return _browser_step_adapter.validate_python(step_data)


def resolve_execution_steps(
    *,
    config: dict[str, Any] | None,
    target_url: str,
) -> list[BrowserStep]:
    """Return explicit steps or a backward-compatible default pipeline."""
    parsed = parse_browser_task_config(config)
    if parsed.steps:
        return list(parsed.steps)

    steps: list[BrowserStep] = [BrowserStepGoto(url="{{target_url}}")]

    legacy_wait = (config or {}).get("wait_for_selector")
    if isinstance(legacy_wait, str) and legacy_wait.strip():
        steps.append(
            BrowserStepWaitForSelector(
                selector=legacy_wait.strip(),
            )
        )

    steps.append(
        BrowserStepExtract(
            selectors=[
                BrowserExtractSelector(name="body_text", selector="body", attribute="text"),
            ]
        )
    )
    return steps


def substitute_template(value: str, *, target_url: str, secrets: dict[str, str] | None = None) -> str:
    from app.services.browser_secrets import substitute_step_templates

    return substitute_step_templates(value, target_url=target_url, secrets=secrets or {})
