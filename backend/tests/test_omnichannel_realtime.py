"""Tests for omnichannel realtime event publishing."""

from __future__ import annotations

import asyncio
import json
import uuid

from app.services.omnichannel_event_bus import (
    omnichannel_event_bus,
    publish_omnichannel_event_sync,
    set_omnichannel_event_loop,
)


def test_sync_publish_reaches_sse_subscriber() -> None:
    async def run() -> None:
        organization_id = uuid.uuid4()
        set_omnichannel_event_loop(asyncio.get_running_loop())
        queue = await omnichannel_event_bus.subscribe(organization_id)

        async def wait_for_event() -> dict:
            payload = await asyncio.wait_for(queue.get(), timeout=2.0)
            return json.loads(payload)

        waiter = asyncio.create_task(wait_for_event())
        await asyncio.sleep(0.05)

        conversation_id = str(uuid.uuid4())
        await asyncio.to_thread(
            publish_omnichannel_event_sync,
            organization_id,
            "message_created",
            {
                "conversation_id": conversation_id,
                "message": "New omnichannel message received",
            },
        )
        await asyncio.sleep(0.05)

        event = await waiter
        assert event["event"] == "message_created"
        assert event["data"]["conversation_id"] == conversation_id

        await omnichannel_event_bus.unsubscribe(organization_id, queue)

    asyncio.run(run())
