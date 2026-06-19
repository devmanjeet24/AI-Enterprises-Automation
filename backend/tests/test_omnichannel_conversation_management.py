"""Tests for omnichannel conversation archive, soft delete, and inbox filters."""

import uuid

from fastapi.testclient import TestClient


def _create_channel(client: TestClient, headers: dict[str, str]) -> dict:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/omnichannel-channels",
        json={
            "name": f"Inbox Cleanup {unique}",
            "slug": f"inbox-cleanup-{unique}",
            "channel_type": "internal",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_conversation(client: TestClient, headers: dict[str, str], channel_id: str) -> dict:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/omnichannel-conversations",
        json={
            "channel_id": channel_id,
            "subject": f"Test conversation {unique}",
            "slug": f"test-conversation-{unique}",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_soft_delete_hides_conversation_from_inbox(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_channel(client, auth_headers)
    conversation = _create_conversation(client, auth_headers, channel["id"])

    inbox_before = client.get("/api/v1/omnichannel-conversations/inbox", headers=auth_headers)
    assert inbox_before.status_code == 200
    assert any(item["id"] == conversation["id"] for item in inbox_before.json())

    delete_response = client.delete(
        f"/api/v1/omnichannel-conversations/{conversation['id']}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204

    inbox_after = client.get("/api/v1/omnichannel-conversations/inbox", headers=auth_headers)
    assert inbox_after.status_code == 200
    assert not any(item["id"] == conversation["id"] for item in inbox_after.json())

    detail = client.get(
        f"/api/v1/omnichannel-conversations/{conversation['id']}",
        headers=auth_headers,
    )
    assert detail.status_code == 404

    audit = client.get(
        f"/api/v1/omnichannel-conversations/{conversation['id']}/audit-logs",
        headers=auth_headers,
    )
    assert audit.status_code == 200
    assert any(log["action"] == "conversation_deleted" for log in audit.json())


def test_archive_moves_conversation_to_archived_inbox(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_channel(client, auth_headers)
    conversation = _create_conversation(client, auth_headers, channel["id"])

    archive_response = client.patch(
        f"/api/v1/omnichannel-conversations/{conversation['id']}",
        json={"is_archived": True},
        headers=auth_headers,
    )
    assert archive_response.status_code == 200
    assert archive_response.json()["archived_at"] is not None

    active_inbox = client.get(
        "/api/v1/omnichannel-conversations/inbox?inbox_view=active",
        headers=auth_headers,
    )
    assert active_inbox.status_code == 200
    assert not any(item["id"] == conversation["id"] for item in active_inbox.json())

    archived_inbox = client.get(
        "/api/v1/omnichannel-conversations/inbox?inbox_view=archived",
        headers=auth_headers,
    )
    assert archived_inbox.status_code == 200
    assert any(item["id"] == conversation["id"] for item in archived_inbox.json())

    audit = client.get(
        f"/api/v1/omnichannel-conversations/{conversation['id']}/audit-logs",
        headers=auth_headers,
    )
    assert audit.status_code == 200
    assert any(log["action"] == "conversation_archived" for log in audit.json())


def test_bulk_archive_and_delete(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_channel(client, auth_headers)
    first = _create_conversation(client, auth_headers, channel["id"])
    second = _create_conversation(client, auth_headers, channel["id"])

    bulk_archive = client.post(
        "/api/v1/omnichannel-conversations/bulk/archive",
        json={"conversation_ids": [first["id"], second["id"]]},
        headers=auth_headers,
    )
    assert bulk_archive.status_code == 200
    body = bulk_archive.json()
    assert body["affected_count"] == 2

    archived_inbox = client.get(
        "/api/v1/omnichannel-conversations/inbox?inbox_view=archived",
        headers=auth_headers,
    )
    archived_ids = {item["id"] for item in archived_inbox.json()}
    assert first["id"] in archived_ids
    assert second["id"] in archived_ids

    bulk_delete = client.post(
        "/api/v1/omnichannel-conversations/bulk/delete",
        json={"conversation_ids": [first["id"], second["id"]]},
        headers=auth_headers,
    )
    assert bulk_delete.status_code == 200
    assert bulk_delete.json()["affected_count"] == 2

    archived_after_delete = client.get(
        "/api/v1/omnichannel-conversations/inbox?inbox_view=archived",
        headers=auth_headers,
    )
    archived_after_ids = {item["id"] for item in archived_after_delete.json()}
    assert first["id"] not in archived_after_ids
    assert second["id"] not in archived_after_ids


def test_inbox_status_filter(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_channel(client, auth_headers)
    conversation = _create_conversation(client, auth_headers, channel["id"])

    update = client.patch(
        f"/api/v1/omnichannel-conversations/{conversation['id']}",
        json={"status": "waiting_human"},
        headers=auth_headers,
    )
    assert update.status_code == 200

    filtered = client.get(
        "/api/v1/omnichannel-conversations/inbox?status=waiting_human",
        headers=auth_headers,
    )
    assert filtered.status_code == 200
    ids = {item["id"] for item in filtered.json()}
    assert conversation["id"] in ids

    other = client.get(
        "/api/v1/omnichannel-conversations/inbox?status=open",
        headers=auth_headers,
    )
    assert other.status_code == 200
    assert conversation["id"] not in {item["id"] for item in other.json()}


def test_unarchive_restores_conversation_to_active_inbox(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_channel(client, auth_headers)
    conversation = _create_conversation(client, auth_headers, channel["id"])

    archive_response = client.patch(
        f"/api/v1/omnichannel-conversations/{conversation['id']}",
        json={"is_archived": True},
        headers=auth_headers,
    )
    assert archive_response.status_code == 200

    unarchive_response = client.patch(
        f"/api/v1/omnichannel-conversations/{conversation['id']}",
        json={"is_archived": False},
        headers=auth_headers,
    )
    assert unarchive_response.status_code == 200
    assert unarchive_response.json()["archived_at"] is None

    active_inbox = client.get(
        "/api/v1/omnichannel-conversations/inbox?inbox_view=active",
        headers=auth_headers,
    )
    assert active_inbox.status_code == 200
    assert any(item["id"] == conversation["id"] for item in active_inbox.json())

    audit = client.get(
        f"/api/v1/omnichannel-conversations/{conversation['id']}/audit-logs",
        headers=auth_headers,
    )
    assert audit.status_code == 200
    actions = {log["action"] for log in audit.json()}
    assert "conversation_archived" in actions
    assert "conversation_unarchived" in actions


def test_inbox_resolved_status_filter(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_channel(client, auth_headers)
    conversation = _create_conversation(client, auth_headers, channel["id"])

    message = client.post(
        f"/api/v1/omnichannel-conversations/{conversation['id']}/messages",
        json={"content": "Thanks, your issue is fixed.", "role": "agent"},
        headers=auth_headers,
    )
    assert message.status_code == 201

    resolve = client.patch(
        f"/api/v1/omnichannel-conversations/{conversation['id']}",
        json={"status": "resolved"},
        headers=auth_headers,
    )
    assert resolve.status_code == 200

    filtered = client.get(
        "/api/v1/omnichannel-conversations/inbox?status=resolved",
        headers=auth_headers,
    )
    assert filtered.status_code == 200
    assert conversation["id"] in {item["id"] for item in filtered.json()}

    open_only = client.get(
        "/api/v1/omnichannel-conversations/inbox?status=open",
        headers=auth_headers,
    )
    assert open_only.status_code == 200
    assert conversation["id"] not in {item["id"] for item in open_only.json()}
