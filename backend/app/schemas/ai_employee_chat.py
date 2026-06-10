"""Pydantic schemas for AI employee chat and conversations."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.knowledge_query import KnowledgeSourceCitation
from app.schemas.validators import StrippedKnowledgeQuestion


class AIEmployeeChatRequest(BaseModel):
    message: StrippedKnowledgeQuestion
    conversation_id: uuid.UUID | None = None


class AIEmployeeChatResponse(BaseModel):
    conversation_id: uuid.UUID
    employee_id: uuid.UUID
    employee_name: str
    answer: str
    sources: list[KnowledgeSourceCitation]


class AIEmployeeMessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    sources: list[dict[str, Any]] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIEmployeeConversationResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    ai_employee_id: uuid.UUID
    user_id: uuid.UUID
    title: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIEmployeeConversationDetailResponse(AIEmployeeConversationResponse):
    messages: list[AIEmployeeMessageResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
