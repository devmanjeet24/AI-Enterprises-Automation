"""Tests for browser task execution, history, and analytics."""

from fastapi.testclient import TestClient

SELENIUM_FORM_URL = "https://www.selenium.dev/selenium/web/web-form.html"


def _create_ready_task(client: TestClient, headers: dict[str, str], **task_overrides) -> dict:
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
    task_payload = {
        "name": "Pricing Scrape",
        "browser_profile_id": profile["id"],
        "target_url": "https://example.com",
        "instructions": "Extract pricing tiers.",
    }
    task_payload.update(task_overrides)
    task = client.post(
        "/api/v1/browser-tasks",
        json=task_payload,
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
    assert execution["result"]["simulated"] is False
    assert execution["result"]["page_title"] == "Example Domain"
    assert "example" in execution["result"]["extracted_text"].lower()
    assert execution["result"]["target_url"] == "https://example.com"
    assert execution["execution_metadata"]["engine"] == "playwright"
    assert execution["execution_metadata"]["step_engine"] is True
    assert execution["logs"] is not None
    assert len(execution["logs"]) >= 3
    assert execution["started_at"] is not None
    assert execution["completed_at"] is not None
    assert len(execution["execution_metadata"]["step_timeline"]) >= 1

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


def test_run_browser_task_with_step_sequence(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    task = _create_ready_task(
        client,
        auth_headers,
        name="Form Interaction Task",
        target_url=SELENIUM_FORM_URL,
        config={
            "steps": [
                {"action": "goto", "url": "{{target_url}}"},
                {"action": "wait_for_selector", "selector": "input[name='my-text']"},
                {"action": "fill", "selector": "input[name='my-text']", "value": "Hello Browser"},
                {"action": "click", "selector": "#my-check-2"},
                {
                    "action": "extract",
                    "selectors": [
                        {
                            "name": "text_input",
                            "selector": "input[name='my-text']",
                            "attribute": "value",
                        },
                        {
                            "name": "checkbox_checked",
                            "selector": "#my-check-2",
                            "attribute": "checked",
                        },
                    ],
                },
            ]
        },
    )

    run = client.post(
        f"/api/v1/browser-tasks/{task['id']}/run",
        headers=auth_headers,
    )
    assert run.status_code == 201, run.text
    execution = run.json()
    assert execution["status"] == "completed"
    assert execution["result"]["steps_completed"] == 5
    assert execution["result"]["extracted"]["text_input"] == "Hello Browser"
    assert execution["result"]["extracted"]["checkbox_checked"] is True
    assert any("Step 3/5: Fill" in entry["message"] for entry in execution["logs"])
    assert any("Step 4/5: Click" in entry["message"] for entry in execution["logs"])


def test_step_failure_records_failed_step(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    task = _create_ready_task(
        client,
        auth_headers,
        name="Failing Step Task",
        target_url="https://example.com",
        config={
            "steps": [
                {"action": "goto", "url": "{{target_url}}"},
                {"action": "click", "selector": "#does-not-exist"},
                {
                    "action": "extract",
                    "selectors": [{"name": "title", "selector": "h1"}],
                },
            ]
        },
    )

    run = client.post(
        f"/api/v1/browser-tasks/{task['id']}/run",
        headers=auth_headers,
    )
    assert run.status_code == 201, run.text
    run_body = run.json()
    assert run_body["status"] == "failed"
    executions = client.get(
        f"/api/v1/browser-tasks/{task['id']}/executions",
        headers=auth_headers,
    ).json()
    assert len(executions) == 1
    execution = client.get(
        f"/api/v1/browser-tasks/executions/{executions[0]['id']}",
        headers=auth_headers,
    ).json()
    assert execution["status"] == "failed"
    assert execution["execution_metadata"]["failed_step"]["index"] == 1
    assert execution["execution_metadata"]["failed_step"]["action"] == "click"
    assert execution["result"]["steps_completed"] == 1
    assert execution["execution_metadata"]["has_failure_screenshot"] is True
    assert len(execution["execution_metadata"]["step_timeline"]) == 2
    assert execution["execution_metadata"]["step_timeline"][1]["status"] == "failed"

    screenshot = client.get(
        f"/api/v1/browser-tasks/executions/{execution['id']}/screenshot",
        headers=auth_headers,
    )
    assert screenshot.status_code == 200
    assert screenshot.headers["content-type"].startswith("image/png")


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
