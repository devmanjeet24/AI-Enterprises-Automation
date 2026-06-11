"""Tests for workflow automation definition APIs."""

import uuid

from fastapi.testclient import TestClient


def _employee_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Workflow Bot",
        "role": "Operator",
        "description": "Runs workflow steps",
        "system_prompt": "You are an automation operator. Execute assigned workflow steps carefully.",
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
        "name": "Workflow Team",
        "description": "Team for workflow automation",
    }
    payload.update(overrides)
    response = client.post(
        "/api/v1/agent-teams",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _workflow_payload(team_id: str, **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Report Workflow",
        "description": "Research then summarize",
        "agent_team_id": team_id,
        "steps": [
            {
                "name": "Research",
                "description": "Gather source material",
                "sequence_order": 0,
            },
            {
                "name": "Summarize",
                "description": "Produce final output",
                "sequence_order": 1,
            },
        ],
    }
    payload.update(overrides)
    return payload


def test_create_list_get_update_delete_workflow(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)
    employee = _create_employee(client, auth_headers)
    _activate_employee(client, auth_headers, employee["id"])
    client.post(
        f"/api/v1/agent-teams/{team['id']}/members",
        json={
            "ai_employee_id": employee["id"],
            "collaboration_role": "operator",
            "sequence_order": 0,
        },
        headers=auth_headers,
    )

    create_response = client.post(
        "/api/v1/workflows",
        json=_workflow_payload(team["id"]),
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    created = create_response.json()
    assert created["slug"] == "report-workflow"
    assert created["status"] == "draft"
    assert created["agent_team_id"] == team["id"]
    assert len(created["steps"]) == 2
    assert created["steps"][0]["name"] == "Research"

    list_response = client.get("/api/v1/workflows", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == created["id"] for item in list_response.json())

    get_response = client.get(
        f"/api/v1/workflows/{created['id']}",
        headers=auth_headers,
    )
    assert get_response.status_code == 200

    update_response = client.patch(
        f"/api/v1/workflows/{created['id']}",
        json={
            "name": "Updated Workflow",
            "status": "active",
            "steps": [
                {
                    "name": "Collect",
                    "sequence_order": 0,
                },
                {
                    "name": "Review",
                    "sequence_order": 1,
                },
                {
                    "name": "Publish",
                    "sequence_order": 2,
                },
            ],
        },
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == "Updated Workflow"
    assert updated["status"] == "active"
    assert len(updated["steps"]) == 3

    delete_response = client.delete(
        f"/api/v1/workflows/{created['id']}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204

    missing_response = client.get(
        f"/api/v1/workflows/{created['id']}",
        headers=auth_headers,
    )
    assert missing_response.status_code == 404


def test_reject_workflow_with_duplicate_steps(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)

    response = client.post(
        "/api/v1/workflows",
        json=_workflow_payload(
            team["id"],
            steps=[
                {"name": "Step A", "sequence_order": 0},
                {"name": "Step B", "sequence_order": 0},
            ],
        ),
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "sequence_order" in response.json()["detail"].lower()


def test_reject_workflow_on_inactive_team(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)
    client.patch(
        f"/api/v1/agent-teams/{team['id']}",
        json={"is_active": False},
        headers=auth_headers,
    )

    response = client.post(
        "/api/v1/workflows",
        json=_workflow_payload(team["id"]),
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "active" in response.json()["detail"].lower()


def test_reject_duplicate_workflow_slug(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    team = _create_team(client, auth_headers)
    client.post(
        "/api/v1/workflows",
        json=_workflow_payload(team["id"], slug="report-flow"),
        headers=auth_headers,
    )

    response = client.post(
        "/api/v1/workflows",
        json=_workflow_payload(team["id"], name="Other", slug="report-flow"),
        headers=auth_headers,
    )
    assert response.status_code == 409


def test_workflow_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    missing_id = str(uuid.uuid4())
    response = client.get(
        f"/api/v1/workflows/{missing_id}",
        headers=auth_headers,
    )
    assert response.status_code == 404
