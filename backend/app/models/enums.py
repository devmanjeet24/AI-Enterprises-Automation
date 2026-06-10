"""Shared enumerations for ORM models."""

import enum


class DocumentStatus(str, enum.Enum):
    """Lifecycle state of an uploaded knowledge document."""

    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
