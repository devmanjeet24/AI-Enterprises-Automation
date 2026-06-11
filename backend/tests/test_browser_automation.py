"""Tests for browser automation profile and task definition APIs."""

import uuid

from fastapi.testclient import TestClient


def test_browser_profile_crud_lifecycle(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/api/v1/browser-profiles",
        json={
            "name": "Desktop Chrome",
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "viewport_width": 1440,
            "viewport_height": 900,
            "config": {"locale": "en-US"},
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    profile = create_response.json()
    assert profile["slug"] == "desktop-chrome"
    assert profile["is_active"] is True

    list_response = client.get("/api/v1/browser-profiles", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == profile["id"] for item in list_response.json())

    get_response = client.get(
        f"/api/v1/browser-profiles/{profile['id']}",
        headers=auth_headers,
    )
    assert get_response.status_code == 200

    patch_response = client.patch(
        f"/api/v1/browser-profiles/{profile['id']}",
        json={"description": "Default desktop profile"},
        headers=auth_headers,
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["description"] == "Default desktop profile"

    delete_response = client.delete(
        f"/api/v1/browser-profiles/{profile['id']}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204


def test_browser_task_crud_lifecycle(client: TestClient, auth_headers: dict[str, str]) -> None:
    profile_response = client.post(
        "/api/v1/browser-profiles",
        json={"name": "Headless Profile"},
        headers=auth_headers,
    )
    assert profile_response.status_code == 201
    profile_id = profile_response.json()["id"]

    create_response = client.post(
        "/api/v1/browser-tasks",
        json={
            "name": "Pricing Page Scrape",
            "browser_profile_id": profile_id,
            "target_url": "https://example.com/pricing",
            "instructions": "Capture headline pricing tiers.",
            "config": {"wait_for_selector": "h1"},
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    task = create_response.json()
    assert task["slug"] == "pricing-page-scrape"
    assert task["status"] == "draft"

    list_response = client.get(
        f"/api/v1/browser-tasks?browser_profile_id={profile_id}",
        headers=auth_headers,
    )
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    patch_response = client.patch(
        f"/api/v1/browser-tasks/{task['id']}",
        json={"status": "ready"},
        headers=auth_headers,
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["status"] == "ready"

    delete_response = client.delete(
        f"/api/v1/browser-tasks/{task['id']}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204


def test_reject_browser_task_for_inactive_profile(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    profile_response = client.post(
        "/api/v1/browser-profiles",
        json={"name": "Inactive Profile"},
        headers=auth_headers,
    )
    profile_id = profile_response.json()["id"]
    client.patch(
        f"/api/v1/browser-profiles/{profile_id}",
        json={"is_active": False},
        headers=auth_headers,
    )

    create_response = client.post(
        "/api/v1/browser-tasks",
        json={
            "name": "Blocked Task",
            "browser_profile_id": profile_id,
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 400
    assert "active" in create_response.json()["detail"].lower()


def test_browser_profile_not_found_returns_404(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.get(
        f"/api/v1/browser-profiles/{uuid.uuid4()}",
        headers=auth_headers,
    )
    assert response.status_code == 404
