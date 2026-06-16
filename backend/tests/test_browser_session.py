"""Tests for browser profile session persistence and login workflows."""

from fastapi.testclient import TestClient

LOGIN_URL = "https://the-internet.herokuapp.com/login"
SECURE_URL = "https://the-internet.herokuapp.com/secure"
LOGOUT_URL = "https://the-internet.herokuapp.com/logout"


def _create_session_profile(client: TestClient, headers: dict[str, str]) -> dict:
    profile = client.post(
        "/api/v1/browser-profiles",
        json={
            "name": "Session Profile",
            "session_persistence_enabled": True,
        },
        headers=headers,
    )
    assert profile.status_code == 201, profile.text
    return profile.json()


def _create_task(
    client: TestClient,
    headers: dict[str, str],
    *,
    profile_id: str,
    name: str,
    target_url: str,
    config: dict,
) -> dict:
    task = client.post(
        "/api/v1/browser-tasks",
        json={
            "name": name,
            "browser_profile_id": profile_id,
            "target_url": target_url,
            "config": config,
        },
        headers=headers,
    )
    assert task.status_code == 201, task.text
    task_data = task.json()
    ready = client.patch(
        f"/api/v1/browser-tasks/{task_data['id']}",
        json={"status": "ready"},
        headers=headers,
    )
    assert ready.status_code == 200, ready.text
    return ready.json()


def _run_task(client: TestClient, headers: dict[str, str], task_id: str) -> dict:
    response = client.post(f"/api/v1/browser-tasks/{task_id}/run", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


LOGIN_CONFIG = {
    "secrets": {
        "username": "tomsmith",
        "password": "SuperSecretPassword!",
    },
    "steps": [
        {"action": "goto", "url": LOGIN_URL},
        {"action": "wait_for_selector", "selector": "#username"},
        {"action": "fill", "selector": "#username", "value": "{{secrets.username}}"},
        {"action": "fill", "selector": "#password", "value": "{{secrets.password}}"},
        {"action": "click", "selector": "button[type='submit']"},
        {"action": "wait_for_selector", "selector": "h4"},
        {
            "action": "extract",
            "selectors": [{"name": "heading", "selector": "h4", "attribute": "text"}],
        },
    ],
}

SECURE_ONLY_CONFIG = {
    "steps": [
        {"action": "goto", "url": SECURE_URL},
        {"action": "wait_for_selector", "selector": "h4"},
        {
            "action": "extract",
            "selectors": [{"name": "heading", "selector": "h4", "attribute": "text"}],
        },
    ],
}

LOGOUT_CONFIG = {
    "steps": [
        {"action": "goto", "url": LOGOUT_URL},
        {
            "action": "extract",
            "selectors": [{"name": "flash", "selector": "#flash", "attribute": "text"}],
        },
    ],
}


def test_login_persists_session_and_reuse_across_runs(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    profile = _create_session_profile(client, auth_headers)
    login_task = _create_task(
        client,
        auth_headers,
        profile_id=profile["id"],
        name="Login Task",
        target_url=LOGIN_URL,
        config=LOGIN_CONFIG,
    )

    login_execution = _run_task(client, auth_headers, login_task["id"])
    assert "Secure Area" in login_execution["result"]["extracted"]["heading"]
    assert login_execution["execution_metadata"]["session_saved"] is True
    assert login_execution["execution_metadata"]["session_loaded"] is False

    profile_detail = client.get(
        f"/api/v1/browser-profiles/{profile['id']}",
        headers=auth_headers,
    ).json()
    assert profile_detail["session_persistence_enabled"] is True
    assert profile_detail["session_stored"] is True
    assert profile_detail["session_updated_at"] is not None

    secure_task = _create_task(
        client,
        auth_headers,
        profile_id=profile["id"],
        name="Secure Area Task",
        target_url=SECURE_URL,
        config=SECURE_ONLY_CONFIG,
    )
    secure_execution = _run_task(client, auth_headers, secure_task["id"])
    assert secure_execution["execution_metadata"]["session_loaded"] is True
    assert "Welcome to the Secure Area" in secure_execution["result"]["extracted"]["heading"]
    assert any(
        "Loaded persisted browser session" in entry["message"]
        for entry in secure_execution["logs"]
    )


def test_logout_invalidates_reused_session(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    profile = _create_session_profile(client, auth_headers)
    login_task = _create_task(
        client,
        auth_headers,
        profile_id=profile["id"],
        name="Login Before Logout",
        target_url=LOGIN_URL,
        config=LOGIN_CONFIG,
    )
    _run_task(client, auth_headers, login_task["id"])

    logout_task = _create_task(
        client,
        auth_headers,
        profile_id=profile["id"],
        name="Logout Task",
        target_url=LOGOUT_URL,
        config=LOGOUT_CONFIG,
    )
    logout_execution = _run_task(client, auth_headers, logout_task["id"])
    assert "You logged out" in logout_execution["result"]["extracted"]["flash"]

    secure_task = _create_task(
        client,
        auth_headers,
        profile_id=profile["id"],
        name="Secure After Logout",
        target_url=SECURE_URL,
        config=SECURE_ONLY_CONFIG,
    )
    secure_run = client.post(
        f"/api/v1/browser-tasks/{secure_task['id']}/run",
        headers=auth_headers,
    )
    assert secure_run.status_code == 201, secure_run.text
    secure_execution = secure_run.json()
    assert "Welcome to the Secure Area" not in secure_execution["result"]["extracted"]["heading"]
    assert "log into the secure area" in secure_execution["result"]["extracted"]["heading"].lower()


def test_clear_profile_session_endpoint(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    profile = _create_session_profile(client, auth_headers)
    login_task = _create_task(
        client,
        auth_headers,
        profile_id=profile["id"],
        name="Login For Clear",
        target_url=LOGIN_URL,
        config=LOGIN_CONFIG,
    )
    _run_task(client, auth_headers, login_task["id"])

    cleared = client.delete(
        f"/api/v1/browser-profiles/{profile['id']}/session",
        headers=auth_headers,
    )
    assert cleared.status_code == 200, cleared.text
    data = cleared.json()
    assert data["session_stored"] is False
    assert data["session_updated_at"] is None
