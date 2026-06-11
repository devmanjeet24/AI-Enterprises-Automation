"""Tests for sequential agent task execution."""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import agent_tasks as agent_tasks_endpoints
from app.api.v1.endpoints import employees as employees_endpoints
from app.config import get_settings
from app.main import app
from app.services.employee_rag_service import EmployeeRAGService
from tests.test_ai_employee_management import _upload_ready_embedded_document
from tests.test_document_retrieval import MockEmbeddingService


class SequentialMockLLM:
    def __init__(self) -> None:
        self._responses = [
            "Research findings: revenue grew 12% in Q2.",
            "Executive summary: Q2 revenue increased by 12%.",
        ]
        self._call_count = 0

    def invoke(self, messages: list) -> object:
        content = self._responses[min(self._call_count, len(self._responses) - 1)]
        self._call_count += 1

        class Response:
            pass

        response = Response()
        response.content = content
        return response


class InactiveStepMockLLM(SequentialMockLLM):
    pass


@pytest.fixture(autouse=True)
def groq_api_key_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GROQ_API_KEY", os.getenv("GROQ_API_KEY", "test-groq-key"))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def execution_client(
    client: TestClient,
    upload_settings,
    chroma_settings,
) -> TestClient:
    mock_llm = SequentialMockLLM()
    app.dependency_overrides[employees_endpoints.get_embedding_service] = (
        lambda: MockEmbeddingService()
    )
    app.dependency_overrides[employees_endpoints.get_employee_rag_service] = (
        lambda: EmployeeRAGService(get_settings(), llm=mock_llm)
    )
    app.dependency_overrides[agent_tasks_endpoints.get_embedding_service] = (
        lambda: MockEmbeddingService()
    )
    app.dependency_overrides[agent_tasks_endpoints.get_employee_rag_service] = (
        lambda: EmployeeRAGService(get_settings(), llm=mock_llm)
    )
    yield client
    for endpoint in (employees_endpoints, agent_tasks_endpoints):
        app.dependency_overrides.pop(endpoint.get_embedding_service, None)
        app.dependency_overrides.pop(endpoint.get_employee_rag_service, None)


def _employee_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Research Bot",
        "role": "Researcher",
        "description": "Gathers information",
        "system_prompt": "You are a research assistant. Gather and summarize relevant information.",
    }
    payload.update(overrides)
    return payload


def _create_employee(client: TestClient, headers: dict[str, str], **overrides: object) -> dict:
    response = client.post(
        "/api/v1/employees",
        json=_employee_payload(**overrides),
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _activate_employee(client: TestClient, headers: dict[str, str], employee_id: str) -> dict:
    response = client.post(
        f"/api/v1/employees/{employee_id}/activate",
        headers=headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


def _prepare_employee_with_knowledge(
    client: TestClient,
    headers: dict[str, str],
    *,
    name: str,
    role: str,
    system_prompt: str,
    document_title: str,
) -> dict:
    employee = _create_employee(
        client,
        headers,
        name=name,
        role=role,
        system_prompt=system_prompt,
    )
    document = _upload_ready_embedded_document(client, headers, title=document_title)
    assign = client.put(
        f"/api/v1/employees/{employee['id']}/knowledge",
        json={"knowledge_document_ids": [document["id"]]},
        headers=headers,
    )
    assert assign.status_code == 200, assign.text
    _activate_employee(client, headers, employee["id"])
    return employee


def _create_team(client: TestClient, headers: dict[str, str]) -> dict:
    response = client.post(
        "/api/v1/agent-teams",
        json={"name": "Execution Pipeline", "description": "Research then summarize"},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _add_member(
    client: TestClient,
    headers: dict[str, str],
    team_id: str,
    employee_id: str,
    *,
    collaboration_role: str,
    sequence_order: int,
) -> None:
    response = client.post(
        f"/api/v1/agent-teams/{team_id}/members",
        json={
            "ai_employee_id": employee_id,
            "collaboration_role": collaboration_role,
            "sequence_order": sequence_order,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text


def test_run_agent_task_executes_members_sequentially(
    execution_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    researcher = _prepare_employee_with_knowledge(
        execution_client,
        auth_headers,
        name="Researcher",
        role="Researcher",
        system_prompt="You research company performance and cite knowledge documents.",
        document_title="Performance Report",
    )
    analyst = _prepare_employee_with_knowledge(
        execution_client,
        auth_headers,
        name="Analyst",
        role="Analyst",
        system_prompt="You summarize research findings for executives.",
        document_title="Executive Brief",
    )
    team = _create_team(execution_client, auth_headers)
    _add_member(
        execution_client,
        auth_headers,
        team["id"],
        researcher["id"],
        collaboration_role="research",
        sequence_order=0,
    )
    _add_member(
        execution_client,
        auth_headers,
        team["id"],
        analyst["id"],
        collaboration_role="analyst",
        sequence_order=1,
    )

    create_response = execution_client.post(
        f"/api/v1/agent-teams/{team['id']}/tasks",
        json={
            "title": "Q2 performance report",
            "description": "Analyze and summarize Q2 revenue performance",
            "input_payload": {"quarter": "Q2"},
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    task_id = create_response.json()["id"]

    run_response = execution_client.post(
        f"/api/v1/agent-tasks/{task_id}/run",
        headers=auth_headers,
    )
    assert run_response.status_code == 200, run_response.text
    result = run_response.json()
    assert result["status"] == "completed"
    assert "12%" in result["result"].lower()

    executions = result["executions"]
    assert len(executions) == 2
    assert executions[0]["status"] == "completed"
    assert executions[1]["status"] == "completed"
    assert executions[0]["output"] is not None
    assert executions[1]["output"] is not None
    assert executions[1]["input_summary"] is not None
    assert "revenue grew 12%" in executions[0]["output"].lower()
    assert executions[0]["started_at"] is not None
    assert executions[0]["completed_at"] is not None


def test_reject_running_completed_task(
    execution_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _prepare_employee_with_knowledge(
        execution_client,
        auth_headers,
        name="Solo Agent",
        role="Writer",
        system_prompt="You complete assigned writing tasks.",
        document_title="Style Guide",
    )
    team = _create_team(execution_client, auth_headers)
    _add_member(
        execution_client,
        auth_headers,
        team["id"],
        employee["id"],
        collaboration_role="writer",
        sequence_order=0,
    )

    create_response = execution_client.post(
        f"/api/v1/agent-teams/{team['id']}/tasks",
        json={"title": "One-shot", "description": "Single-step task"},
        headers=auth_headers,
    )
    task_id = create_response.json()["id"]
    first_run = execution_client.post(
        f"/api/v1/agent-tasks/{task_id}/run",
        headers=auth_headers,
    )
    assert first_run.status_code == 200

    second_run = execution_client.post(
        f"/api/v1/agent-tasks/{task_id}/run",
        headers=auth_headers,
    )
    assert second_run.status_code == 400


def test_fail_task_when_employee_inactive(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers, name="Inactive Agent")
    _activate_employee(client, auth_headers, employee["id"])
    team = _create_team(client, auth_headers)
    _add_member(
        client,
        auth_headers,
        team["id"],
        employee["id"],
        collaboration_role="writer",
        sequence_order=0,
    )

    create_response = client.post(
        f"/api/v1/agent-teams/{team['id']}/tasks",
        json={"title": "Will fail", "description": "Inactive employee step"},
        headers=auth_headers,
    )
    task_id = create_response.json()["id"]

    deactivate = client.post(
        f"/api/v1/employees/{employee['id']}/deactivate",
        headers=auth_headers,
    )
    assert deactivate.status_code == 200

    run_response = client.post(
        f"/api/v1/agent-tasks/{task_id}/run",
        headers=auth_headers,
    )
    assert run_response.status_code == 200
    result = run_response.json()
    assert result["status"] == "failed"
    assert result["executions"][0]["status"] == "failed"
    assert "not active" in result["executions"][0]["error_message"].lower()


def test_agent_task_run_not_found(
    execution_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = execution_client.post(
        f"/api/v1/agent-tasks/{uuid.uuid4()}/run",
        headers=auth_headers,
    )
    assert response.status_code == 404
