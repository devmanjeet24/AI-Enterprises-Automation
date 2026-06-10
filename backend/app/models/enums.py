"""Shared enumerations for ORM models."""

import enum


class DocumentStatus(str, enum.Enum):
    """Lifecycle state of an uploaded knowledge document."""

    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class AIEmployeeStatus(str, enum.Enum):
    """Whether an AI employee can receive chat requests."""

    ACTIVE = "active"
    INACTIVE = "inactive"


class MessageRole(str, enum.Enum):
    """Author of one message in an AI employee conversation."""

    USER = "user"
    ASSISTANT = "assistant"
