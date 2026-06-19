"""In-memory event bus for omnichannel SSE real-time updates."""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any
from uuid import UUID

logger = logging.getLogger(__name__)

_main_event_loop: asyncio.AbstractEventLoop | None = None


def set_omnichannel_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Register the FastAPI event loop for publishes from sync worker threads."""
    global _main_event_loop
    _main_event_loop = loop


class OmnichannelEventBus:
    """Per-organization pub/sub for Server-Sent Events."""

    def __init__(self) -> None:
        self._subscribers: dict[UUID, set[asyncio.Queue[str]]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def subscribe(self, organization_id: UUID) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers[organization_id].add(queue)
        return queue

    async def unsubscribe(self, organization_id: UUID, queue: asyncio.Queue[str]) -> None:
        async with self._lock:
            subscribers = self._subscribers.get(organization_id)
            if subscribers is None:
                return
            subscribers.discard(queue)
            if not subscribers:
                self._subscribers.pop(organization_id, None)

    async def publish(self, organization_id: UUID, event: str, data: dict[str, Any]) -> None:
        payload = json.dumps({"event": event, "data": data})
        async with self._lock:
            subscribers = list(self._subscribers.get(organization_id, set()))
        for queue in subscribers:
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                continue


omnichannel_event_bus = OmnichannelEventBus()


def publish_omnichannel_event_sync(
    organization_id: UUID,
    event: str,
    data: dict[str, Any],
) -> None:
    """Publish from async handlers or sync FastAPI endpoints (thread pool)."""
    coro = omnichannel_event_bus.publish(organization_id, event, data)
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(coro)
        return
    except RuntimeError:
        pass

    main_loop = _main_event_loop
    if main_loop is not None and main_loop.is_running():
        asyncio.run_coroutine_threadsafe(coro, main_loop)
        return

    logger.warning(
        "Omnichannel event loop is not registered; dropped %s for org %s",
        event,
        organization_id,
    )
