import logging
from typing import Any

from app.integrations import get_adapter

logger = logging.getLogger("flowbot.tasks")


async def dispatch(integration_names: list[str], event: dict[str, Any]) -> dict[str, str]:
    results: dict[str, str] = {}
    for name in integration_names:
        adapter = get_adapter(name)
        if not adapter:
            results[name] = "unknown_adapter"
            continue
        try:
            await adapter.send(event)
            results[name] = "ok"
        except Exception as exc:  # noqa: BLE001 - integrations must not crash runtime
            logger.warning("integration %s failed: %s", name, exc)
            results[name] = "error"
    return results
