"""Tests for business research project APIs."""

import uuid

from fastapi.testclient import TestClient


def _create_employee(client: TestClient, headers: dict[str, str], **overrides: object) -> dict:
    payload: dict[str, object] = {
        "name": "Research Bot",
        "role": "Analyst",
        "description": "Runs research steps",
        "system_prompt": "You are a business research analyst. Produce structured findings.",
    }
    payload.update(overrides)
    response = client.post("/api/v1/employees", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _activate_employee(client: TestClient, headers: dict[str, str], employee_id: str) -> dict:
    response = client.post(f"/api/v1/employees/{employee_id}/activate", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def _create_team(client: TestClient, headers: dict[str, str], **overrides: object) -> dict:
    payload: dict[str, object] = {
        "name": "Research Team",
        "description": "Team for business research",
    }
    payload.update(overrides)
    response = client.post("/api/v1/agent-teams", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_list_research_templates(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/v1/research-projects/templates", headers=auth_headers)
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) == 4
    template_types = {item["template_type"] for item in templates}
    assert template_types == {
        "market_research",
        "competitor_analysis",
        "industry_analysis",
        "swot_analysis",
    }


def test_research_project_crud_lifecycle(client: TestClient, auth_headers: dict[str, str]) -> None:
    employee = _create_employee(client, auth_headers)
    _activate_employee(client, auth_headers, employee["id"])
    team = _create_team(client, auth_headers)
    member_response = client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "analyst",
            "sequence_order": 0,
        },
        headers=auth_headers,
    )
    assert member_response.status_code == 201, member_response.text

    create_response = client.post(
        "/api/v1/research-projects",
        json={
            "name": "Q2 Market Study",
            "research_brief": "Analyze demand trends for AI automation platforms in SMB segment.",
            "template_type": "market_research",
            "agent_team_id": team["id"],
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    project = create_response.json()
    assert project["slug"] == "q2-market-study"
    assert project["status"] == "draft"
    assert project["template_type"] == "market_research"

    list_response = client.get("/api/v1/research-projects", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == project["id"] for item in list_response.json())

    get_response = client.get(
        f"/api/v1/research-projects/{project['id']}",
        headers=auth_headers,
    )
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Q2 Market Study"

    patch_response = client.patch(
        f"/api/v1/research-projects/{project['id']}",
        json={"status": "active", "description": "Quarterly market study"},
        headers=auth_headers,
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["status"] == "active"

    delete_response = client.delete(
        f"/api/v1/research-projects/{project['id']}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204

    missing_response = client.get(
        f"/api/v1/research-projects/{project['id']}",
        headers=auth_headers,
    )
    assert missing_response.status_code == 404


def test_reject_duplicate_research_project_slug(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)
    _activate_employee(client, auth_headers, employee["id"])
    team = _create_team(client, auth_headers)
    client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "analyst",
            "sequence_order": 0,
        },
        headers=auth_headers,
    )

    payload = {
        "name": "Competitor Watch",
        "slug": "competitor-watch",
        "research_brief": "Track competitor pricing and positioning.",
        "template_type": "competitor_analysis",
        "agent_team_id": team["id"],
    }
    first = client.post("/api/v1/research-projects", json=payload, headers=auth_headers)
    assert first.status_code == 201

    second = client.post("/api/v1/research-projects", json=payload, headers=auth_headers)
    assert second.status_code == 409


def test_research_project_not_found_returns_404(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.get(
        f"/api/v1/research-projects/{uuid.uuid4()}",
        headers=auth_headers,
    )
    assert response.status_code == 404
