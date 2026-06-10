"""Create, configure, and manage AI employees."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.ai_employee import AIEmployee
from app.models.ai_employee_document import AIEmployeeDocument
from app.models.ai_employee_tool import AIEmployeeTool
from app.models.enums import AIEmployeeStatus, DocumentStatus
from app.models.knowledge_document import KnowledgeDocument
from app.schemas.ai_employee import (
    AIEmployeeCreateRequest,
    AIEmployeeToolAssignmentRequest,
    AIEmployeeUpdateRequest,
)
from app.services.tools.registry import is_known_tool_slug


def get_employee_or_404(
    db: Session,
    *,
    employee_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> AIEmployee:
    """Load one AI employee within the given organization or raise 404."""
    employee = db.scalar(
        select(AIEmployee).where(
            AIEmployee.id == employee_id,
            AIEmployee.organization_id == organization_id,
        )
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI employee not found",
        )
    return employee


def get_employee_detail_or_404(
    db: Session,
    *,
    employee_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> AIEmployee:
    """Load one AI employee with knowledge and tool assignments."""
    employee = db.scalar(
        select(AIEmployee)
        .where(
            AIEmployee.id == employee_id,
            AIEmployee.organization_id == organization_id,
        )
        .options(
            selectinload(AIEmployee.document_assignments),
            selectinload(AIEmployee.tools),
        )
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI employee not found",
        )
    return employee


def list_employees(
    db: Session,
    *,
    organization_id: uuid.UUID,
    employee_status: AIEmployeeStatus | None = None,
) -> list[AIEmployee]:
    """List AI employees for one organization, optionally filtered by status."""
    query = select(AIEmployee).where(AIEmployee.organization_id == organization_id)
    if employee_status is not None:
        query = query.where(AIEmployee.status == employee_status)

    return list(
        db.scalars(query.order_by(AIEmployee.created_at.desc())).all()
    )


def create_employee(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: AIEmployeeCreateRequest,
) -> AIEmployee:
    """Create a new AI employee in the current organization."""
    employee = AIEmployee(
        organization_id=organization_id,
        created_by_id=created_by_id,
        name=payload.name,
        role=payload.role,
        description=payload.description,
        system_prompt=payload.system_prompt,
        status=payload.status,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def update_employee(
    db: Session,
    *,
    employee: AIEmployee,
    payload: AIEmployeeUpdateRequest,
) -> AIEmployee:
    """Apply partial updates to an AI employee."""
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    for field, value in updates.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    return employee


def delete_employee(db: Session, *, employee: AIEmployee) -> None:
    """Delete an AI employee and cascade related assignments."""
    db.delete(employee)
    db.commit()


def list_knowledge_assignments(
    db: Session,
    *,
    employee: AIEmployee,
) -> list[AIEmployeeDocument]:
    """Return knowledge document assignments for one employee."""
    return list(
        db.scalars(
            select(AIEmployeeDocument)
            .where(AIEmployeeDocument.ai_employee_id == employee.id)
            .order_by(AIEmployeeDocument.assigned_at)
        ).all()
    )


def replace_knowledge_assignments(
    db: Session,
    *,
    employee: AIEmployee,
    organization_id: uuid.UUID,
    knowledge_document_ids: list[uuid.UUID],
) -> list[AIEmployeeDocument]:
    """Replace all knowledge document assignments for one employee."""
    unique_document_ids = list(dict.fromkeys(knowledge_document_ids))

    if not unique_document_ids:
        db.execute(
            delete(AIEmployeeDocument).where(
                AIEmployeeDocument.ai_employee_id == employee.id
            )
        )
        db.commit()
        return []

    documents = list(
        db.scalars(
            select(KnowledgeDocument).where(
                KnowledgeDocument.id.in_(unique_document_ids),
                KnowledgeDocument.organization_id == organization_id,
            )
        ).all()
    )
    documents_by_id = {document.id: document for document in documents}

    missing_ids = [
        document_id
        for document_id in unique_document_ids
        if document_id not in documents_by_id
    ]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more knowledge documents were not found in this organization",
        )

    invalid_documents = [
        document
        for document in documents
        if document.status != DocumentStatus.READY or document.embedded_at is None
    ]
    if invalid_documents:
        titles = ", ".join(document.title for document in invalid_documents)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only processed and embedded documents can be assigned. "
                f"Invalid documents: {titles}"
            ),
        )

    db.execute(
        delete(AIEmployeeDocument).where(
            AIEmployeeDocument.ai_employee_id == employee.id
        )
    )

    now = datetime.now(UTC)
    assignments = [
        AIEmployeeDocument(
            ai_employee_id=employee.id,
            knowledge_document_id=document_id,
            assigned_at=now,
        )
        for document_id in unique_document_ids
    ]
    db.add_all(assignments)
    db.commit()

    return list_knowledge_assignments(db, employee=employee)


def list_tool_assignments(
    db: Session,
    *,
    employee: AIEmployee,
) -> list[AIEmployeeTool]:
    """Return tool assignments for one employee."""
    return list(
        db.scalars(
            select(AIEmployeeTool)
            .where(AIEmployeeTool.ai_employee_id == employee.id)
            .order_by(AIEmployeeTool.tool_slug)
        ).all()
    )


def _validate_tool_assignments(
    tools: list[AIEmployeeToolAssignmentRequest],
) -> list[AIEmployeeToolAssignmentRequest]:
    if not tools:
        return []

    normalized: list[AIEmployeeToolAssignmentRequest] = []
    seen_slugs: set[str] = set()

    for tool in tools:
        if tool.tool_slug in seen_slugs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate tool slug '{tool.tool_slug}' in request",
            )
        if not is_known_tool_slug(tool.tool_slug):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown tool slug '{tool.tool_slug}'",
            )
        seen_slugs.add(tool.tool_slug)
        normalized.append(tool)

    return normalized


def replace_tool_assignments(
    db: Session,
    *,
    employee: AIEmployee,
    tools: list[AIEmployeeToolAssignmentRequest],
) -> list[AIEmployeeTool]:
    """Replace all tool assignments for one employee."""
    validated_tools = _validate_tool_assignments(tools)

    db.execute(
        delete(AIEmployeeTool).where(AIEmployeeTool.ai_employee_id == employee.id)
    )

    if not validated_tools:
        db.commit()
        return []

    new_tools = [
        AIEmployeeTool(
            ai_employee_id=employee.id,
            tool_slug=tool.tool_slug,
            is_enabled=tool.is_enabled,
            config=tool.config,
        )
        for tool in validated_tools
    ]
    db.add_all(new_tools)
    db.commit()

    return list_tool_assignments(db, employee=employee)


def activate_employee(db: Session, *, employee: AIEmployee) -> AIEmployee:
    """Mark an AI employee as active."""
    if employee.status == AIEmployeeStatus.ACTIVE:
        return employee

    employee.status = AIEmployeeStatus.ACTIVE
    db.commit()
    db.refresh(employee)
    return employee


def deactivate_employee(db: Session, *, employee: AIEmployee) -> AIEmployee:
    """Mark an AI employee as inactive."""
    if employee.status == AIEmployeeStatus.INACTIVE:
        return employee

    employee.status = AIEmployeeStatus.INACTIVE
    db.commit()
    db.refresh(employee)
    return employee
