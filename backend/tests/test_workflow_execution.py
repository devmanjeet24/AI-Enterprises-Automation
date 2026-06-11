"""Tests for workflow run and execution history APIs."""

import os

import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import employees as employees_endpoints
from app.api.v1.endpoints import workflows as workflows_endpoints
from app.config import get_settings
from app.main import app
from app.services.employee_rag_service import EmployeeRAGService
from tests.test_ai_employee_management import _upload_ready_embedded_document
from tests.test_document_retrieval import MockEmbeddingService


class WorkflowMockLLM:
    def __init__(self) -> None:
        self._responses = [
            "Collected source notes about Q2 revenue growth.",
            "Published summary: Q2 revenue increased by 12%.",
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


@pytest.fixture(autouse=True)
def groq_api_key_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GROQ_API_KEY", os.getenv("GROQ_API_KEY", "test-groq-key"))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def workflow_execution_client(
    client: TestClient,
    upload_settings,
    chroma_settings,
) -> TestClient:
    mock_llm = WorkflowMockLLM()
    for endpoint in (employees_endpoints, workflows_endpoints):
        app.dependency_overrides[endpoint.get_embedding_service] = (
            lambda: MockEmbeddingService()
        )
        app.dependency_overrides[endpoint.get_employee_rag_service] = (
            lambda: EmployeeRAGService(get_settings(), llm=mock_llm)
        )
    yield client
    for endpoint in (employees_endpoints, workflows_endpoints):
        app.dependency_overrides.pop(endpoint.get_embedding_service, None)
        app.dependency_overrides.pop(endpoint.get_employee_rag_service, None)


def _employee_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Workflow Bot",
        "role": "Operator",
        "description": "Runs workflow steps",
        "system_prompt": "You are an automation operator. Execute assigned workflow steps carefully.",
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


def _prepare_employee(
    client: TestClient,
    headers: dict[str, str],
    *,
    name: str,
    role: str,
    document_title: str,
) -> dict:
    employee = _create_employee(client, headers, name=name, role=role)
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
        json={"name": "Workflow Team", "description": "Team for workflow automation"},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_active_workflow(
    client: TestClient,
    headers: dict[str, str],
    team_id: str,
) -> dict:
    create_response = client.post(
        "/api/v1/workflows",
        json={
            "name": "Report Workflow",
            "description": "Collect and publish",
            "agent_team_id": team_id,
            "steps": [
                {
                    "name": "Collect",
                    "description": "Gather source material",
                    "sequence_order": 0,
                    "config": {"prompt": "Collect source material for the report"},
                },
                {
                    "name": "Publish",
                    "description": "Publish the final summary",
                    "sequence_order": 1,
                    "config": {"prompt": "Publish the final executive summary"},
                },
            ],
        },
        headers=headers,
    )
    assert create_response.status_code == 201, create_response.text
    workflow = create_response.json()

    activate_response = client.patch(
        f"/api/v1/workflows/{workflow['id']}",
        json={"status": "active"},
        headers=headers,
    )
    assert activate_response.status_code == 200, activate_response.text
    return activate_response.json()


def test_run_workflow_creates_task_and_stores_execution_history(
    workflow_execution_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    collector = _prepare_employee(
        workflow_execution_client,
        auth_headers,
        name="Collector",
        role="Collector",
        document_title="Source Notes",
    )
    publisher = _prepare_employee(
        workflow_execution_client,
        auth_headers,
        name="Publisher",
        role="Publisher",
        document_title="Publishing Guide",
    )
    team = _create_team(workflow_execution_client, auth_headers)

    for employee, role, order in (
        (collector, "collect", 0),
        (publisher, "publish", 1),
    ):
        response = workflow_execution_client.post(
            f"/api/v1/agent-teams/{team['id']}/members",
            json={
                "ai_employee_id": employee["id"],
                "collaboration_role": role,
                "sequence_order": order,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text

    workflow = _create_active_workflow(workflow_execution_client, auth_headers, team["id"])

    run_response = workflow_execution_client.post(
        f"/api/v1/workflows/{workflow['id']}/run",
        json={"input_payload": {"quarter": "Q2"}},
        headers=auth_headers,
    )
    assert run_response.status_code == 201, run_response.text
    execution = run_response.json()
    assert execution["status"] == "completed"
    assert execution["agent_task_id"] is not None
    assert execution["final_output"] is not None
    assert "12%" in execution["final_output"].lower()
    assert execution["started_at"] is not None
    assert execution["completed_at"] is not None
    assert execution["agent_task"] is not None
    assert execution["agent_task"]["status"] == "completed"
    assert len(execution["agent_task"]["executions"]) == 2

    history_response = workflow_execution_client.get(
        f"/api/v1/workflows/{workflow['id']}/executions",
        headers=auth_headers,
    )
    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history) == 1
    assert history[0]["id"] == execution["id"]


def test_reject_workflow_run_when_not_active(
    workflow_execution_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _prepare_employee(
        workflow_execution_client,
        auth_headers,
        name="Solo",
        role="Operator",
        document_title="Ops Guide",
    )
    team = _create_team(workflow_execution_client, auth_headers)
    workflow_execution_client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "operator",
            "sequence_order": 0,
        },
        headers=auth_headers,
    )

    create_response = workflow_execution_client.post(
        "/api/v1/workflows",
        json={
            "name": "Draft Workflow",
            "agent_team_id": team["id"],
            "steps": [{"name": "Only Step", "sequence_order": 0}],
        },
        headers=auth_headers,
    )
    workflow_id = create_response.json()["id"]

    run_response = workflow_execution_client.post(
        f"/api/v1/workflows/{workflow_id}/run",
        json={},
        headers=auth_headers,
    )
    assert run_response.status_code == 400
    assert "active" in run_response.json()["detail"].lower()
