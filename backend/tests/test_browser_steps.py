"""Tests for browser step schema validation."""

import pytest
from pydantic import ValidationError

from app.schemas.browser_step import parse_browser_task_config


def test_reject_extract_step_before_other_steps() -> None:
    with pytest.raises(ValidationError):
        parse_browser_task_config(
            {
                "steps": [
                    {"action": "extract", "selectors": [{"name": "title", "selector": "h1"}]},
                    {"action": "click", "selector": "button"},
                ]
            }
        )


def test_accept_valid_step_sequence() -> None:
    config = parse_browser_task_config(
        {
            "steps": [
                {"action": "goto", "url": "https://example.com"},
                {"action": "wait_for_selector", "selector": "h1"},
                {"action": "fill", "selector": "#email", "value": "user@example.com"},
                {"action": "click", "selector": "button[type='submit']"},
                {
                    "action": "extract",
                    "selectors": [{"name": "heading", "selector": "h1"}],
                },
            ]
        }
    )
    assert len(config.steps) == 5
