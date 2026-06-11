import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.ai_employee import AIEmployee
    from app.models.knowledge_document import KnowledgeDocument


class AIEmployeeDocument(Base):
    """Links one AI employee to one knowledge document within the same organization."""

    __tablename__ = "ai_employee_documents"

    ai_employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employees.id", ondelete="CASCADE"),
        primary_key=True,
    )
    knowledge_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    ai_employee: Mapped["AIEmployee"] = relationship(back_populates="document_assignments")
    knowledge_document: Mapped["KnowledgeDocument"] = relationship(
        back_populates="ai_employee_assignments",
    )
