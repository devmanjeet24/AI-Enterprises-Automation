"""Tests for LinkedIn omnichannel integration."""

from __future__ import annotations

import hashlib
import hmac
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.services.linkedin_service import compute_webhook_challenge_response


@pytest.fixture(autouse=True)
def linkedin_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LINKEDIN_CLIENT_ID", "test-linkedin-client-id")
    monkeypatch.setenv("LINKEDIN_CLIENT_SECRET", "test-linkedin-client-secret")
    monkeypatch.setenv("API_PUBLIC_URL", "https://api.example.com")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _create_linkedin_channel(client: TestClient, headers: dict[str, str]) -> dict:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/omnichannel-channels",
        json={
            "name": f"LinkedIn Support {unique}",
            "slug": f"linkedin-support-{unique}",
            "channel_type": "linkedin",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_linkedin_webhook_challenge_response(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_linkedin_channel(client, auth_headers)
    challenge = "test-challenge-code"
    response = client.get(
        f"/api/v1/omnichannel-webhooks/linkedin/{channel['id']}",
        params={"challengeCode": challenge},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["challengeCode"] == challenge
    expected = compute_webhook_challenge_response(
        challenge_code=challenge,
        client_secret="test-linkedin-client-secret",
    )
    assert body["challengeResponse"] == expected


@patch(
    "app.services.omnichannel_conversation_service._generate_ai_response",
    return_value=("Thanks for your comment!", []),
)
@patch("app.services.omnichannel_connector_service.create_comment")
def test_linkedin_comment_webhook_routes_reply_to_same_thread(
    mock_create_comment: object,
    _mock_generate: object,
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee_response = client.post(
        "/api/v1/employees",
        json={
            "name": "LinkedIn Bot",
            "role": "Support",
            "description": "LinkedIn support",
            "system_prompt": "You are helpful.",
        },
        headers=auth_headers,
    )
    assert employee_response.status_code == 201, employee_response.text
    employee_id = employee_response.json()["id"]
    activate = client.post(f"/api/v1/employees/{employee_id}/activate", headers=auth_headers)
    assert activate.status_code == 200, activate.text

    unique = uuid.uuid4().hex[:8]
    channel = client.post(
        "/api/v1/omnichannel-channels",
        json={
            "name": f"LinkedIn Support {unique}",
            "slug": f"linkedin-support-{unique}",
            "channel_type": "linkedin",
            "ai_employee_id": employee_id,
            "config": {
                "linkedin_organization_urn": "urn:li:organization:12345",
                "oauth_access_token": "test-token",
            },
        },
        headers=auth_headers,
    ).json()

    comment_urn = "urn:li:comment:(urn:li:activity:29292929292992929292,12345)"
    payload = {
        "type": "ORGANIZATION_SOCIAL_ACTION_NOTIFICATIONS",
        "notifications": [
            {
                "notificationId": 4406004,
                "organizationalEntity": "urn:li:organization:12345",
                "action": "COMMENT",
                "sourcePost": "urn:li:activity:29292929292992929292",
                "generatedActivity": comment_urn,
                "decoratedGeneratedActivity": {
                    "comment": {
                        "entity": comment_urn,
                        "owner": "urn:li:person:member123",
                        "object": "urn:li:activity:29292929292992929292",
                        "message": {"text": "Hello from LinkedIn"},
                    }
                },
            }
        ],
    }

    mock_create_comment.return_value = {"id": "999"}

    response = client.post(
        f"/api/v1/omnichannel-webhooks/linkedin/{channel['id']}",
        json=payload,
    )
    assert response.status_code == 200, response.text
    assert response.json()["message_id"]

    from app.services.omnichannel_connector_service import create_comment

    create_comment.assert_called_once()
    call_kwargs = create_comment.call_args.kwargs
    assert call_kwargs["actor_urn"] == "urn:li:organization:12345"
    assert call_kwargs["object_urn"] == "urn:li:activity:29292929292992929292"
    assert call_kwargs["target_urn"] == comment_urn
    assert "Thanks for your comment" in call_kwargs["text"]


@patch("app.api.v1.endpoints.linkedin_integration.exchange_linkedin_oauth_code")
@patch("app.api.v1.endpoints.linkedin_integration.get_userinfo")
@patch("app.api.v1.endpoints.linkedin_integration.list_admin_organizations")
@patch("app.api.v1.endpoints.linkedin_integration.get_organization")
@patch("app.api.v1.endpoints.linkedin_integration.subscribe_organization_notifications")
def test_linkedin_oauth_callback_stores_tokens(
    mock_subscribe: object,
    mock_get_org: object,
    mock_list_orgs: object,
    mock_userinfo: object,
    mock_exchange: object,
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_linkedin_channel(client, auth_headers)

    mock_exchange.return_value = {
        "access_token": "oauth-access-token",
        "expires_in": 3600,
        "scope": "rw_organization_admin",
    }
    mock_userinfo.return_value = {"sub": "member123", "name": "Admin User"}
    mock_list_orgs.return_value = [
        {"organization": "urn:li:organization:12345", "role": "ADMINISTRATOR"},
    ]
    mock_get_org.return_value = {"localizedName": "Acme Corp"}
    mock_subscribe.return_value = {"webhook": "https://api.example.com/webhook"}

    response = client.get(
        "/api/v1/integrations/linkedin/oauth/callback",
        params={"code": "auth-code", "state": channel["id"]},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "connected"
    assert body["organization_urn"] == "urn:li:organization:12345"
    assert body["organization_name"] == "Acme Corp"

    detail = client.get(f"/api/v1/omnichannel-channels/{channel['id']}", headers=auth_headers)
    assert detail.status_code == 200, detail.text
    config = detail.json()["config"]
    assert config["oauth_access_token"] == "oauth-access-token"
    assert config["linkedin_organization_urn"] == "urn:li:organization:12345"
    assert config["linkedin_organization_name"] == "Acme Corp"


def test_linkedin_install_redirects_to_authorize_url(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_linkedin_channel(client, auth_headers)
    response = client.get(
        f"/api/v1/integrations/linkedin/install?channel_id={channel['id']}",
        follow_redirects=False,
    )
    assert response.status_code == 302, response.text
    location = response.headers["location"]
    assert location.startswith("https://www.linkedin.com/oauth/v2/authorization")
    assert "client_id=test-linkedin-client-id" in location
    assert "state=" + channel["id"] in location
