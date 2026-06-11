"""Tests for multi-agent collaboration team management APIs."""

import uuid

from fastapi.testclient import TestClient


def _employee_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Research Bot",
        "role": "Researcher",
        "description": "Gathers information",
        "system_prompt": "You are a research assistant. Gather and summarize relevant information.",
    }
    payload.update(overrides)
    return payload


def _create_employee(
    client: TestClient,
    headers: dict[str, str],
    **overrides: object,
) -> dict:
    response = client.post(
        "/api/v1/employees",
        json=_employee_payload(**overrides),
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _activate_employee(
    client: TestClient,
    headers: dict[str, str],
    employee_id: str,
) -> dict:
    response = client.post(
        f"/api/v1/employees/{employee_id}/activate",
        headers=headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


def _create_team(
    client: TestClient,
    headers: dict[str, str],
    **overrides: object,
) -> dict:
    payload: dict[str, object] = {
        "name": "Report Pipeline",
        "description": "Research, analyze, write, review",
    }
    payload.update(overrides)
    response = client.post(
        "/api/v1/agent-teams",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_create_list_get_update_delete_agent_team(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    created = _create_team(client, auth_headers, name="Content Squad")

    list_response = client.get("/api/v1/agent-teams", headers=auth_headers)
    assert list_response.status_code == 200
    names = {item["name"] for item in list_response.json()}
    assert "Content Squad" in names

    get_response = client.get(
        f"/api/v1/agent-teams/{created['id']}",
        headers=auth_headers,
    )
    assert get_response.status_code == 200
    assert get_response.json()["slug"] == "content-squad"
    assert get_response.json()["created_by_id"] is not None

    update_response = client.patch(
        f"/api/v1/agent-teams/{created['id']}",
        json={"name": "Content Team", "is_active": False},
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Content Team"
    assert update_response.json()["is_active"] is False

    delete_response = client.delete(
        f"/api/v1/agent-teams/{created['id']}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204

    missing_response = client.get(
        f"/api/v1/agent-teams/{created['id']}",
        headers=auth_headers,
    )
    assert missing_response.status_code == 404


def test_team_membership_lifecycle(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)
    researcher = _create_employee(client, auth_headers, name="Researcher")
    analyst = _create_employee(client, auth_headers, name="Analyst")
    _activate_employee(client, auth_headers, researcher["id"])
    _activate_employee(client, auth_headers, analyst["id"])

    add_researcher = client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": researcher["id"],
            "collaboration_role": "research",
            "sequence_order": 0,
        },
        headers=auth_headers,
    )
    assert add_researcher.status_code == 201, add_researcher.text
    researcher_member = add_researcher.json()
    assert researcher_member["employee_name"] == "Researcher"
    assert researcher_member["collaboration_role"] == "research"

    add_analyst = client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": analyst["id"],
            "collaboration_role": "analyst",
            "sequence_order": 1,
        },
        headers=auth_headers,
    )
    assert add_analyst.status_code == 201, add_analyst.text

    members_response = client.get(
        f"/api/v1/agent-teams/{team['id']}/members",
        headers=auth_headers,
    )
    assert members_response.status_code == 200
    members = members_response.json()
    assert len(members) == 2
    assert members[0]["collaboration_role"] == "research"
    assert members[1]["collaboration_role"] == "analyst"

    remove_response = client.delete(
        f"/api/v1/agent-teams/{team['id']}/members/{researcher_member['id']}",
        headers=auth_headers,
    )
    assert remove_response.status_code == 204

    remaining_response = client.get(
        f"/api/v1/agent-teams/{team['id']}/members",
        headers=auth_headers,
    )
    assert len(remaining_response.json()) == 1


def test_reject_inactive_employee_membership(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)
    employee = _create_employee(client, auth_headers)

    response = client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "writer",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "active" in response.json()["detail"].lower()


def test_reject_duplicate_team_member(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)
    employee = _create_employee(client, auth_headers)
    _activate_employee(client, auth_headers, employee["id"])

    first = client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "reviewer",
        },
        headers=auth_headers,
    )
    assert first.status_code == 201

    duplicate = client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "reviewer",
        },
        headers=auth_headers,
    )
    assert duplicate.status_code == 409


def test_reject_duplicate_team_slug(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    _create_team(client, auth_headers, name="Pipeline Alpha", slug="report-pipeline")

    response = client.post(
        "/api/v1/agent-teams",
        json={"name": "Other", "slug": "report-pipeline"},
        headers=auth_headers,
    )
    assert response.status_code == 409


def test_agent_team_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    missing_id = str(uuid.uuid4())
    response = client.get(
        f"/api/v1/agent-teams/{missing_id}",
        headers=auth_headers,
    )
    assert response.status_code == 404
