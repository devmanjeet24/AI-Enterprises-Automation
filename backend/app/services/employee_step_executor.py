"""Execute one AI employee step within a multi-agent task pipeline."""

import json
import uuid
from dataclasses import dataclass
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.ai_employee import AIEmployee
from app.models.enums import AIEmployeeStatus
from app.schemas.knowledge_query import NO_RELEVANT_INFORMATION_MESSAGE, KnowledgeSourceCitation
from app.services.ai_employee_service import list_knowledge_assignments, list_tool_assignments
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_rag_service import EmployeeRAGService, citations_to_json
from app.services.tools.executor import build_tool_prompt_suffix, try_calculator


@dataclass(frozen=True)
class StepExecutionResult:
    answer: str
    sources: list[KnowledgeSourceCitation]
    output_payload: dict[str, Any]
    input_summary: str


def execute_employee_step(
    db: Session,
    *,
    settings: Settings,
    organization_id: uuid.UUID,
    employee: AIEmployee,
    step_prompt: str,
    task_title: str,
    task_description: str,
    task_input_payload: dict[str, Any] | None,
    collaboration_role: str,
    prior_output: str | None,
    prior_step_name: str | None,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> StepExecutionResult:
    """Run one employee step, optionally grounding on assigned knowledge."""
    if employee.status != AIEmployeeStatus.ACTIVE:
        raise ValueError(f"AI employee '{employee.name}' is not active")

    tool_assignments = list_tool_assignments(db, employee=employee)
    enabled_tools = [tool for tool in tool_assignments if tool.is_enabled]
    enabled_tool_slugs = {tool.tool_slug for tool in enabled_tools}

    assignments = list_knowledge_assignments(db, employee=employee)
    document_ids = [assignment.knowledge_document_id for assignment in assignments]

    question = _build_step_question(
        step_prompt=step_prompt,
        task_title=task_title,
        task_description=task_description,
        task_input_payload=task_input_payload,
        collaboration_role=collaboration_role,
        prior_output=prior_output,
        prior_step_name=prior_step_name,
    )
    input_summary = question[:2000]

    calculator_result = None
    if "calculator" in enabled_tool_slugs:
        calculator_result = try_calculator(step_prompt)

    system_prompt = employee.system_prompt.strip()
    system_prompt = f"{system_prompt}{build_tool_prompt_suffix(enabled_tools)}"

    conversation_history: list[tuple[str, str]] = []
    if prior_output:
        prior_label = prior_step_name or "Previous step"
        conversation_history.append(("user", f"{prior_label} produced the following output:"))
        conversation_history.append(("assistant", prior_output))

    sources: list[KnowledgeSourceCitation] = []
    use_rag = bool(document_ids) and (
        "knowledge_search" in enabled_tool_slugs or not enabled_tool_slugs
    )

    if calculator_result is not None and not use_rag:
        answer = calculator_result
        output_payload = {
            "tool_results": {"calculator": calculator_result},
            "used_tools": ["calculator"],
        }
    elif use_rag:
        answer, sources = employee_rag_service.answer_for_employee(
            organization_id=organization_id,
            system_prompt=system_prompt,
            question=question,
            document_ids=document_ids,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
            conversation_history=conversation_history or None,
        )
        used_rag = True
        if answer == NO_RELEVANT_INFORMATION_MESSAGE:
            answer = _generate_without_retrieval(
                employee_rag_service=employee_rag_service,
                system_prompt=system_prompt,
                question=question,
                conversation_history=conversation_history,
            )
            sources = []
            used_rag = False
        output_payload = {
            "sources": citations_to_json(sources),
            "used_tools": _resolve_used_tools(enabled_tool_slugs, used_rag=used_rag),
        }
        if calculator_result is not None:
            output_payload["tool_results"] = {"calculator": calculator_result}
    else:
        answer = _generate_without_retrieval(
            employee_rag_service=employee_rag_service,
            system_prompt=system_prompt,
            question=question,
            conversation_history=conversation_history,
        )
        output_payload = {
            "used_tools": _resolve_used_tools(enabled_tool_slugs, used_rag=False),
        }
        if calculator_result is not None:
            output_payload["tool_results"] = {"calculator": calculator_result}

    return StepExecutionResult(
        answer=answer,
        sources=sources,
        output_payload=output_payload,
        input_summary=input_summary,
    )


def _resolve_used_tools(enabled_tool_slugs: set[str], *, used_rag: bool) -> list[str]:
    used: list[str] = []
    if used_rag and ("knowledge_search" in enabled_tool_slugs or not enabled_tool_slugs):
        used.append("knowledge_search")
    if "calculator" in enabled_tool_slugs:
        used.append("calculator")
    return used


def _build_step_question(
    *,
    step_prompt: str,
    task_title: str,
    task_description: str,
    task_input_payload: dict[str, Any] | None,
    collaboration_role: str,
    prior_output: str | None,
    prior_step_name: str | None,
) -> str:
    sections = [
        f"Task title: {task_title}",
        f"Task description: {task_description}",
        f"Your collaboration role: {collaboration_role}",
    ]
    if task_input_payload:
        sections.append(f"Task input data: {json.dumps(task_input_payload, default=str)}")
    if prior_output:
        label = prior_step_name or "Previous agent"
        sections.append(f"Output from {label}:\n{prior_output}")
    sections.append(f"Your assignment:\n{step_prompt}")
    return "\n\n".join(sections)


def _generate_without_retrieval(
    *,
    employee_rag_service: EmployeeRAGService,
    system_prompt: str,
    question: str,
    conversation_history: list[tuple[str, str]],
) -> str:
    history_messages: list[HumanMessage | AIMessage] = []
    for role, content in conversation_history:
        if role == "user":
            history_messages.append(HumanMessage(content=content))
        else:
            history_messages.append(AIMessage(content=content))

    return employee_rag_service._rag_service._generate_answer(
        question=question,
        context="No knowledge base context is available for this step.",
        system_prompt=system_prompt,
        history_messages=history_messages or None,
    )
