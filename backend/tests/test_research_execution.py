"""Tests for research project execution and reporting APIs."""

import os

import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import employees as employees_endpoints
from app.api.v1.endpoints import research_projects as research_projects_endpoints
from app.config import get_settings
from app.main import app
from app.services.employee_rag_service import EmployeeRAGService
from tests.test_ai_employee_management import _upload_ready_embedded_document
from tests.test_document_retrieval import MockEmbeddingService


class ResearchMockLLM:
    def __init__(self) -> None:
        self._responses = [
            "Market size estimated at $4.2B with 18% YoY growth in SMB segment.",
            "Final report: AI automation demand is accelerating among SMB buyers.",
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
def research_execution_client(
    client: TestClient,
    upload_settings,
    chroma_settings,
) -> TestClient:
    mock_llm = ResearchMockLLM()
    for endpoint in (employees_endpoints, research_projects_endpoints):
        app.dependency_overrides[endpoint.get_embedding_service] = (
            lambda: MockEmbeddingService()
        )
        app.dependency_overrides[endpoint.get_employee_rag_service] = (
            lambda: EmployeeRAGService(get_settings(), llm=mock_llm)
        )
    yield client
    for endpoint in (employees_endpoints, research_projects_endpoints):
        app.dependency_overrides.pop(endpoint.get_embedding_service, None)
        app.dependency_overrides.pop(endpoint.get_employee_rag_service, None)


def _employee_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Research Bot",
        "role": "Analyst",
        "description": "Runs research steps",
        "system_prompt": "You are a business research analyst. Produce structured findings.",
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
    response = client.post(f"/api/v1/employees/{employee_id}/activate", headers=headers)
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
        json={"name": "Research Team", "description": "Team for business research"},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_active_project(
    client: TestClient,
    headers: dict[str, str],
    team_id: str,
) -> dict:
    create_response = client.post(
        "/api/v1/research-projects",
        json={
            "name": "SMB Market Study",
            "research_brief": "Analyze AI automation demand among SMB buyers.",
            "template_type": "market_research",
            "agent_team_id": team_id,
        },
        headers=headers,
    )
    assert create_response.status_code == 201, create_response.text
    project = create_response.json()

    activate_response = client.patch(
        f"/api/v1/research-projects/{project['id']}",
        json={"status": "active"},
        headers=headers,
    )
    assert activate_response.status_code == 200, activate_response.text
    return activate_response.json()


def test_run_research_project_generates_report_with_outputs(
    research_execution_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    analyst = _prepare_employee(
        research_execution_client,
        auth_headers,
        name="Analyst",
        role="Analyst",
        document_title="Market Notes",
    )
    writer = _prepare_employee(
        research_execution_client,
        auth_headers,
        name="Writer",
        role="Writer",
        document_title="Report Guide",
    )
    team = _create_team(research_execution_client, auth_headers)

    for employee, role, order in (
        (analyst, "analyst", 0),
        (writer, "writer", 1),
    ):
        response = research_execution_client.post(
            f"/api/v1/agent-teams/{team['id']}/members",
            json={
                "ai_employee_id": employee["id"],
                "collaboration_role": role,
                "sequence_order": order,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text

    project = _create_active_project(research_execution_client, auth_headers, team["id"])

    run_response = research_execution_client.post(
        f"/api/v1/research-projects/{project['id']}/run",
        json={"input_payload": {"segment": "SMB"}},
        headers=auth_headers,
    )
    assert run_response.status_code == 201, run_response.text
    report = run_response.json()
    assert report["status"] == "completed"
    assert report["agent_task_id"] is not None
    assert report["final_output"] is not None
    assert "smb" in report["final_output"].lower()
    assert report["intermediate_outputs"] is not None
    assert len(report["intermediate_outputs"]) == 2
    assert report["execution_metadata"] is not None
    assert report["execution_metadata"]["template_type"] == "market_research"
    assert report["execution_metadata"]["step_count"] == 2
    assert report["started_at"] is not None
    assert report["completed_at"] is not None

    history_response = research_execution_client.get(
        f"/api/v1/research-projects/{project['id']}/reports",
        headers=auth_headers,
    )
    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history) == 1
    assert history[0]["id"] == report["id"]

    detail_response = research_execution_client.get(
        f"/api/v1/research-projects/{project['id']}/reports/{report['id']}",
        headers=auth_headers,
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["final_output"] == report["final_output"]


def test_reject_research_run_when_project_not_active(
    research_execution_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _prepare_employee(
        research_execution_client,
        auth_headers,
        name="Solo",
        role="Analyst",
        document_title="Ops Guide",
    )
    team = _create_team(research_execution_client, auth_headers)
    research_execution_client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "analyst",
            "sequence_order": 0,
        },
        headers=auth_headers,
    )

    create_response = research_execution_client.post(
        "/api/v1/research-projects",
        json={
            "name": "Draft Study",
            "research_brief": "Pending activation.",
            "template_type": "swot_analysis",
            "agent_team_id": team["id"],
        },
        headers=auth_headers,
    )
    project_id = create_response.json()["id"]

    run_response = research_execution_client.post(
        f"/api/v1/research-projects/{project_id}/run",
        json={},
        headers=auth_headers,
    )
    assert run_response.status_code == 400
    assert "active" in run_response.json()["detail"].lower()
