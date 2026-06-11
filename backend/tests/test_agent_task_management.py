"""Tests for agent task submission and tracking APIs."""

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


def _add_member(
    client: TestClient,
    headers: dict[str, str],
    team_id: str,
    employee_id: str,
    *,
    collaboration_role: str,
    sequence_order: int,
) -> dict:
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
    return response.json()


def test_submit_list_and_get_agent_task(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)
    researcher = _create_employee(client, auth_headers, name="Researcher")
    analyst = _create_employee(client, auth_headers, name="Analyst")
    _activate_employee(client, auth_headers, researcher["id"])
    _activate_employee(client, auth_headers, analyst["id"])
    _add_member(
        client,
        auth_headers,
        team["id"],
        researcher["id"],
        collaboration_role="research",
        sequence_order=0,
    )
    _add_member(
        client,
        auth_headers,
        team["id"],
        analyst["id"],
        collaboration_role="analyst",
        sequence_order=1,
    )

    create_response = client.post(
        f"/api/v1/agent-teams/{team['id']}/tasks",
        json={
            "title": "Quarterly report",
            "description": "Compile Q2 performance summary",
            "input_payload": {"quarter": "Q2"},
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    created = create_response.json()
    assert created["status"] == "pending"
    assert created["agent_team_id"] == team["id"]
    assert len(created["executions"]) == 2
    assert created["executions"][0]["sequence_order"] == 0
    assert created["executions"][0]["status"] == "pending"
    assert created["executions"][0]["employee_name"] == "Researcher"
    assert created["executions"][1]["collaboration_role"] == "analyst"

    list_response = client.get("/api/v1/agent-tasks", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == created["id"] for item in list_response.json())

    filtered_response = client.get(
        "/api/v1/agent-tasks",
        params={"status": "pending", "agent_team_id": team["id"]},
        headers=auth_headers,
    )
    assert filtered_response.status_code == 200
    assert len(filtered_response.json()) >= 1

    detail_response = client.get(
        f"/api/v1/agent-tasks/{created['id']}",
        headers=auth_headers,
    )
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["title"] == "Quarterly report"
    assert len(detail["executions"]) == 2


def test_reject_task_on_inactive_team(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)
    employee = _create_employee(client, auth_headers)
    _activate_employee(client, auth_headers, employee["id"])
    _add_member(
        client,
        auth_headers,
        team["id"],
        employee["id"],
        collaboration_role="writer",
        sequence_order=0,
    )

    deactivate_response = client.patch(
        f"/api/v1/agent-teams/{team['id']}",
        json={"is_active": False},
        headers=auth_headers,
    )
    assert deactivate_response.status_code == 200

    response = client.post(
        f"/api/v1/agent-teams/{team['id']}/tasks",
        json={
            "title": "Blocked task",
            "description": "Should not be accepted",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "active" in response.json()["detail"].lower()


def test_reject_task_on_team_without_members(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)

    response = client.post(
        f"/api/v1/agent-teams/{team['id']}/tasks",
        json={
            "title": "Empty team task",
            "description": "No members configured",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "member" in response.json()["detail"].lower()


def test_agent_task_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    missing_id = str(uuid.uuid4())
    response = client.get(
        f"/api/v1/agent-tasks/{missing_id}",
        headers=auth_headers,
    )
    assert response.status_code == 404
