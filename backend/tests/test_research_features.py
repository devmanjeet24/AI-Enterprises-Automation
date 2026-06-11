"""Tests for research analytics, versioning, exports, and execution history."""

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


class VersionMockLLM:
    def __init__(self) -> None:
        self._responses = [
            "Version one findings.",
            "Version one final report.",
            "Version two findings.",
            "Version two final report.",
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
def research_features_client(
    client: TestClient,
    upload_settings,
    chroma_settings,
) -> TestClient:
    mock_llm = VersionMockLLM()
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


def _create_employee(client: TestClient, headers: dict[str, str]) -> dict:
    response = client.post(
        "/api/v1/employees",
        json={
            "name": "Analyst",
            "role": "Analyst",
            "description": "Research analyst",
            "system_prompt": "You are a business research analyst with structured output.",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    employee = response.json()
    client.post(f"/api/v1/employees/{employee['id']}/activate", headers=headers)
    return employee


def _setup_active_project(client: TestClient, headers: dict[str, str]) -> dict:
    employee = _create_employee(client, headers)
    _upload_ready_embedded_document(client, headers, title="Research Notes")
    team_response = client.post(
        "/api/v1/agent-teams",
        json={"name": "Analytics Team", "description": "Research team"},
        headers=headers,
    )
    team = team_response.json()
    client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "analyst",
            "sequence_order": 0,
        },
        headers=headers,
    )
    project_response = client.post(
        "/api/v1/research-projects",
        json={
            "name": "Analytics Study",
            "research_brief": "Track market demand trends.",
            "template_type": "market_research",
            "agent_team_id": team["id"],
        },
        headers=headers,
    )
    project = project_response.json()
    activate = client.patch(
        f"/api/v1/research-projects/{project['id']}",
        json={"status": "active"},
        headers=headers,
    )
    return activate.json()


def test_research_report_versioning_and_execution_history(
    research_features_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    project = _setup_active_project(research_features_client, auth_headers)

    first = research_features_client.post(
        f"/api/v1/research-projects/{project['id']}/run",
        json={},
        headers=auth_headers,
    )
    assert first.status_code == 201, first.text
    assert first.json()["version_number"] == 1

    second = research_features_client.post(
        f"/api/v1/research-projects/{project['id']}/run",
        json={},
        headers=auth_headers,
    )
    assert second.status_code == 201, second.text
    assert second.json()["version_number"] == 2

    history = research_features_client.get(
        f"/api/v1/research-projects/{project['id']}/executions",
        headers=auth_headers,
    )
    assert history.status_code == 200
    executions = history.json()
    assert len(executions) == 2
    assert executions[0]["version_number"] == 2
    assert executions[1]["version_number"] == 1


def test_research_analytics_and_org_report_history(
    research_features_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    project = _setup_active_project(research_features_client, auth_headers)
    research_features_client.post(
        f"/api/v1/research-projects/{project['id']}/run",
        json={},
        headers=auth_headers,
    )

    analytics = research_features_client.get(
        "/api/v1/research-projects/analytics",
        headers=auth_headers,
    )
    assert analytics.status_code == 200
    data = analytics.json()
    assert data["total_projects"] >= 1
    assert data["total_reports"] >= 1
    assert "completed" in data["reports_by_status"]

    reports = research_features_client.get(
        "/api/v1/research-projects/reports",
        headers=auth_headers,
    )
    assert reports.status_code == 200
    assert len(reports.json()) >= 1


def test_research_report_markdown_and_pdf_export(
    research_features_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    project = _setup_active_project(research_features_client, auth_headers)
    run = research_features_client.post(
        f"/api/v1/research-projects/{project['id']}/run",
        json={},
        headers=auth_headers,
    )
    report = run.json()

    markdown = research_features_client.get(
        f"/api/v1/research-projects/{project['id']}/reports/{report['id']}/export/markdown",
        headers=auth_headers,
    )
    assert markdown.status_code == 200
    assert "text/markdown" in markdown.headers["content-type"]
    assert "Analytics Study" in markdown.text
    assert "Version:" in markdown.text

    pdf = research_features_client.get(
        f"/api/v1/research-projects/{project['id']}/reports/{report['id']}/export/pdf",
        headers=auth_headers,
    )
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF")


def test_reject_export_for_incomplete_report(
    research_features_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    project = _setup_active_project(research_features_client, auth_headers)
    employee = _create_employee(research_features_client, auth_headers)
    team_response = research_features_client.post(
        "/api/v1/agent-teams",
        json={"name": "Draft Team", "description": "Draft"},
        headers=auth_headers,
    )
    team = team_response.json()
    research_features_client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "analyst",
            "sequence_order": 0,
        },
        headers=auth_headers,
    )
    draft_project = research_features_client.post(
        "/api/v1/research-projects",
        json={
            "name": "Draft Only",
            "research_brief": "Not runnable yet.",
            "template_type": "swot_analysis",
            "agent_team_id": team["id"],
        },
        headers=auth_headers,
    ).json()

    reports = research_features_client.get(
        f"/api/v1/research-projects/{draft_project['id']}/reports",
        headers=auth_headers,
    )
    assert reports.status_code == 200
    assert reports.json() == []

    export = research_features_client.get(
        f"/api/v1/research-projects/{project['id']}/reports/{project['id']}/export/markdown",
        headers=auth_headers,
    )
    assert export.status_code == 404
