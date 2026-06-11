"""Tests for browser task execution, history, and analytics."""

from fastapi.testclient import TestClient


def _create_ready_task(client: TestClient, headers: dict[str, str]) -> dict:
    profile = client.post(
        "/api/v1/browser-profiles",
        json={
            "name": "Run Profile",
            "user_agent": "Mozilla/5.0 Test",
            "viewport_width": 1280,
            "viewport_height": 720,
        },
        headers=headers,
    ).json()
    task = client.post(
        "/api/v1/browser-tasks",
        json={
            "name": "Pricing Scrape",
            "browser_profile_id": profile["id"],
            "target_url": "https://example.com/pricing",
            "instructions": "Extract pricing tiers.",
        },
        headers=headers,
    ).json()
    ready = client.patch(
        f"/api/v1/browser-tasks/{task['id']}",
        json={"status": "ready"},
        headers=headers,
    )
    assert ready.status_code == 200, ready.text
    return ready.json()


def test_run_browser_task_stores_execution_logs_and_results(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    task = _create_ready_task(client, auth_headers)

    run = client.post(
        f"/api/v1/browser-tasks/{task['id']}/run",
        headers=auth_headers,
    )
    assert run.status_code == 201, run.text
    execution = run.json()
    assert execution["status"] == "completed"
    assert execution["result"]["simulated"] is True
    assert execution["logs"] is not None
    assert len(execution["logs"]) >= 3
    assert execution["started_at"] is not None
    assert execution["completed_at"] is not None

    history = client.get(
        f"/api/v1/browser-tasks/{task['id']}/executions",
        headers=auth_headers,
    )
    assert history.status_code == 200
    assert len(history.json()) == 1

    detail = client.get(
        f"/api/v1/browser-tasks/executions/{execution['id']}",
        headers=auth_headers,
    )
    assert detail.status_code == 200
    assert detail.json()["id"] == execution["id"]


def test_browser_analytics_and_org_execution_history(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    task = _create_ready_task(client, auth_headers)
    client.post(f"/api/v1/browser-tasks/{task['id']}/run", headers=auth_headers)

    analytics = client.get("/api/v1/browser-tasks/analytics", headers=auth_headers)
    assert analytics.status_code == 200
    data = analytics.json()
    assert data["total_profiles"] >= 1
    assert data["total_tasks"] >= 1
    assert data["total_executions"] >= 1
    assert "completed" in data["executions_by_status"]

    executions = client.get("/api/v1/browser-tasks/executions", headers=auth_headers)
    assert executions.status_code == 200
    assert len(executions.json()) >= 1


def test_reject_browser_run_when_task_not_ready(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    profile = client.post(
        "/api/v1/browser-profiles",
        json={"name": "Draft Profile"},
        headers=auth_headers,
    ).json()
    task = client.post(
        "/api/v1/browser-tasks",
        json={
            "name": "Draft Task",
            "browser_profile_id": profile["id"],
            "target_url": "https://example.com",
        },
        headers=auth_headers,
    ).json()

    run = client.post(
        f"/api/v1/browser-tasks/{task['id']}/run",
        headers=auth_headers,
    )
    assert run.status_code == 400
    assert "ready" in run.json()["detail"].lower()


def test_reject_browser_run_when_profile_inactive(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    profile = client.post(
        "/api/v1/browser-profiles",
        json={"name": "Inactive Run Profile"},
        headers=auth_headers,
    ).json()
    client.patch(
        f"/api/v1/browser-profiles/{profile['id']}",
        json={"is_active": False},
        headers=auth_headers,
    )
    task = client.post(
        "/api/v1/browser-tasks",
        json={
            "name": "Blocked Run Task",
            "browser_profile_id": profile["id"],
            "target_url": "https://example.com",
            "instructions": "Should fail.",
        },
        headers=auth_headers,
    )
    assert task.status_code == 400

    ready_task = client.post(
        "/api/v1/browser-tasks",
        json={
            "name": "Ready Then Inactive",
            "browser_profile_id": profile["id"],
            "target_url": "https://example.com",
        },
        headers=auth_headers,
    )
    if ready_task.status_code == 201:
        task_id = ready_task.json()["id"]
        client.patch(
            f"/api/v1/browser-tasks/{task_id}",
            json={"status": "ready"},
            headers=auth_headers,
        )
        run = client.post(
            f"/api/v1/browser-tasks/{task_id}/run",
            headers=auth_headers,
        )
        assert run.status_code == 400
