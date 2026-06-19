"""Secret interpolation for browser automation step values."""

import re
from typing import Any

SECRET_TEMPLATE_PATTERN = re.compile(r"\{\{secrets\.([a-zA-Z0-9_]+)\}\}")


def normalize_task_secrets(config: dict[str, Any] | None) -> dict[str, str]:
    """Extract string secrets from task config."""
    if not config:
        return {}
    raw_secrets = config.get("secrets")
    if not isinstance(raw_secrets, dict):
        return {}

    secrets: dict[str, str] = {}
    for key, value in raw_secrets.items():
        if not isinstance(key, str) or not key.strip():
            continue
        if value is None:
            continue
        if not isinstance(value, str):
            raise ValueError(f"Secret '{key}' must be a string")
        secrets[key.strip()] = value
    return secrets


def substitute_step_templates(
    value: str,
    *,
    target_url: str,
    secrets: dict[str, str],
) -> str:
    """Replace {{target_url}} and {{secrets.key}} placeholders in step values."""
    result = value.replace("{{target_url}}", target_url)

    def _replace_secret(match: re.Match[str]) -> str:
        secret_key = match.group(1)
        if secret_key not in secrets:
            raise ValueError(
                f"Missing secret '{secret_key}' for template {{{{secrets.{secret_key}}}}}"
            )
        return secrets[secret_key]

    return SECRET_TEMPLATE_PATTERN.sub(_replace_secret, result)
