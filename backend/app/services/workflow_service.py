"""Create and manage reusable workflow automation definitions."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.text import slugify
from app.models.agent_team import AgentTeam
from app.models.enums import WorkflowStatus
from app.models.workflow import Workflow
from app.models.workflow_step import WorkflowStep
from app.schemas.workflow import WorkflowCreateRequest, WorkflowStepInput, WorkflowUpdateRequest
from app.services.agent_team_service import get_agent_team_or_404


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_workflow_id: uuid.UUID | None = None,
) -> None:
    query = select(Workflow.id).where(
        Workflow.organization_id == organization_id,
        Workflow.slug == slug,
    )
    if exclude_workflow_id is not None:
        query = query.where(Workflow.id != exclude_workflow_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Workflow slug '{slug}' is already taken in this organization",
        )


def _ensure_active_agent_team(team: AgentTeam) -> None:
    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflows must be attached to an active agent team",
        )


def _validate_unique_step_orders(steps: list[WorkflowStepInput]) -> None:
    sequence_orders = [step.sequence_order for step in steps]
    if len(sequence_orders) != len(set(sequence_orders)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow steps must have unique sequence_order values",
        )


def _coerce_workflow_steps(steps: list[WorkflowStepInput | dict]) -> list[WorkflowStepInput]:
    return [
        step if isinstance(step, WorkflowStepInput) else WorkflowStepInput.model_validate(step)
        for step in steps
    ]


def get_workflow_or_404(
    db: Session,
    *,
    workflow_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Workflow:
    """Load one workflow within the given organization or raise 404."""
    workflow = db.scalar(
        select(Workflow)
        .where(
            Workflow.id == workflow_id,
            Workflow.organization_id == organization_id,
        )
        .options(selectinload(Workflow.steps))
    )
    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )
    return workflow


def list_workflows(
    db: Session,
    *,
    organization_id: uuid.UUID,
    status: WorkflowStatus | None = None,
) -> list[Workflow]:
    """List workflows for one organization, optionally filtered by status."""
    query = (
        select(Workflow)
        .where(Workflow.organization_id == organization_id)
        .options(selectinload(Workflow.steps))
    )
    if status is not None:
        query = query.where(Workflow.status == status)

    return list(db.scalars(query.order_by(Workflow.name)).all())


def _replace_workflow_steps(
    db: Session,
    *,
    workflow: Workflow,
    steps: list[WorkflowStepInput | dict],
) -> None:
    normalized_steps = _coerce_workflow_steps(steps)
    _validate_unique_step_orders(normalized_steps)
    for existing_step in list(workflow.steps):
        db.delete(existing_step)
    db.flush()

    for step in sorted(normalized_steps, key=lambda item: item.sequence_order):
        db.add(
            WorkflowStep(
                workflow_id=workflow.id,
                name=step.name,
                description=step.description,
                sequence_order=step.sequence_order,
                config=step.config,
            )
        )


def create_workflow(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: WorkflowCreateRequest,
) -> Workflow:
    """Create a workflow with ordered steps attached to an active agent team."""
    team = get_agent_team_or_404(
        db,
        team_id=payload.agent_team_id,
        organization_id=organization_id,
    )
    _ensure_active_agent_team(team)
    _validate_unique_step_orders(payload.steps)

    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    workflow = Workflow(
        organization_id=organization_id,
        agent_team_id=team.id,
        created_by_id=created_by_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        status=WorkflowStatus.DRAFT,
    )
    db.add(workflow)
    db.flush()
    _replace_workflow_steps(db, workflow=workflow, steps=payload.steps)
    db.commit()
    return get_workflow_or_404(db, workflow_id=workflow.id, organization_id=organization_id)


def update_workflow(
    db: Session,
    *,
    workflow: Workflow,
    organization_id: uuid.UUID,
    payload: WorkflowUpdateRequest,
) -> Workflow:
    """Apply partial updates to a workflow."""
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    if "agent_team_id" in updates:
        team = get_agent_team_or_404(
            db,
            team_id=updates["agent_team_id"],
            organization_id=organization_id,
        )
        _ensure_active_agent_team(team)
        workflow.agent_team_id = team.id

    if "name" in updates:
        workflow.name = updates["name"]

    if "description" in updates:
        workflow.description = updates["description"]

    if "status" in updates:
        workflow.status = updates["status"]

    if "is_active" in updates:
        workflow.is_active = updates["is_active"]

    if "slug" in updates:
        slug = _resolve_slug(updates.get("name", workflow.name), updates["slug"])
        _ensure_unique_slug(
            db,
            organization_id=organization_id,
            slug=slug,
            exclude_workflow_id=workflow.id,
        )
        workflow.slug = slug

    if "steps" in updates:
        if not updates["steps"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow must have at least one step",
            )
        _replace_workflow_steps(db, workflow=workflow, steps=updates["steps"])

    db.commit()
    return get_workflow_or_404(db, workflow_id=workflow.id, organization_id=organization_id)


def delete_workflow(db: Session, *, workflow: Workflow) -> None:
    """Delete a workflow and cascade related steps."""
    db.delete(workflow)
    db.commit()
