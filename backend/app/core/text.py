"""Text helpers shared across the application."""

import re


def slugify(value: str) -> str:
    """Turn a display name into a URL-safe slug."""
    slug = value.strip().lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")[:100]
