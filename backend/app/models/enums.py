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


class SupportTicketStatus(str, enum.Enum):
    """Lifecycle state of a customer support ticket."""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SupportTicketPriority(str, enum.Enum):
    """Priority level for a support ticket."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class SupportMessageRole(str, enum.Enum):
    """Author role for one message in a support ticket thread."""

    CUSTOMER = "customer"
    AGENT = "agent"
    AI_ASSISTANT = "ai_assistant"
    SYSTEM = "system"


class VoiceSessionStatus(str, enum.Enum):
    """Lifecycle state of a voice AI session."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class VoiceTranscriptRole(str, enum.Enum):
    """Author role for one entry in a voice session transcript."""

    CALLER = "caller"
    AI_ASSISTANT = "ai_assistant"
    SYSTEM = "system"


class OmnichannelChannelType(str, enum.Enum):
    """Supported omnichannel communication channel types."""

    WEBSITE_CHAT = "website_chat"
    TELEGRAM = "telegram"
    SLACK = "slack"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    INTERNAL = "internal"


class OmnichannelAuditAction(str, enum.Enum):
    """Auditable omnichannel lifecycle events."""

    CONVERSATION_CREATED = "conversation_created"
    MESSAGE_SENT = "message_sent"
    STATUS_CHANGED = "status_changed"
    HANDOFF_REQUESTED = "handoff_requested"
    HANDOFF_ASSIGNED = "handoff_assigned"
    AGENT_ASSIGNED = "agent_assigned"
    TICKET_ESCALATED = "ticket_escalated"
    CHANNEL_UPDATED = "channel_updated"
    WIDGET_MESSAGE = "widget_message"
    WEBHOOK_RECEIVED = "webhook_received"


class OmnichannelConversationStatus(str, enum.Enum):
    """Lifecycle state of an omnichannel conversation."""

    OPEN = "open"
    AI_HANDLING = "ai_handling"
    WAITING_HUMAN = "waiting_human"
    RESOLVED = "resolved"
    CLOSED = "closed"


class OmnichannelHandoffStatus(str, enum.Enum):
    """Human handoff state for an omnichannel conversation."""

    NONE = "none"
    REQUESTED = "requested"
    ASSIGNED = "assigned"
    COMPLETED = "completed"


class OmnichannelMessageRole(str, enum.Enum):
    """Author role for one message in an omnichannel conversation."""

    CUSTOMER = "customer"
    AGENT = "agent"
    AI_ASSISTANT = "ai_assistant"
    SYSTEM = "system"
