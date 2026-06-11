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


class AgentTaskStatus(str, enum.Enum):
    """Lifecycle state of a multi-agent collaboration task."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentTaskExecutionStatus(str, enum.Enum):
    """Lifecycle state of one agent's step within a task."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class WorkflowStatus(str, enum.Enum):
    """Lifecycle state of a reusable workflow definition."""

    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ResearchTemplateType(str, enum.Enum):
    """Predefined research methodology applied to a project."""

    MARKET_RESEARCH = "market_research"
    COMPETITOR_ANALYSIS = "competitor_analysis"
    INDUSTRY_ANALYSIS = "industry_analysis"
    SWOT_ANALYSIS = "swot_analysis"


class ResearchProjectStatus(str, enum.Enum):
    """Lifecycle state of a business research project."""

    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class BrowserTaskStatus(str, enum.Enum):
    """Lifecycle state of a browser automation task definition."""

    DRAFT = "draft"
    READY = "ready"
    ARCHIVED = "archived"


class BrowserTaskExecutionStatus(str, enum.Enum):
    """Lifecycle state of one browser task run."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
