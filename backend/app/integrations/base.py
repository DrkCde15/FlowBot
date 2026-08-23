from abc import ABC, abstractmethod
from typing import Any

import httpx

from app.config import settings


class IntegrationEvent(dict):
    pass


class IntegrationAdapter(ABC):
    name: str = "base"

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, "name") or cls.name == "base":
            cls.name = cls.__name__.removesuffix("Adapter").lower()

    @abstractmethod
    async def send(self, event: dict) -> None:
        raise NotImplementedError

    async def _post_json(
        self, url: str, payload: dict, secret: str | None = None, headers: dict | None = None
    ) -> None:
        if not url:
            return
        h = dict(headers or {})
        if secret:
            import hashlib
            import hmac

            digest = hmac.new(secret.encode(), str(payload).encode(), hashlib.sha256).hexdigest()
            h["X-FlowBot-Signature"] = f"sha256={digest}"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json=payload, headers=h)


def build_event(
    *,
    bot_slug: str,
    bot_name: str,
    conversation_id: str,
    variable: str | None,
    value: str | None,
    answers: list[dict] | None = None,
    completed: bool = False,
) -> dict:
    return {
        "bot_slug": bot_slug,
        "bot_name": bot_name,
        "conversation_id": conversation_id,
        "variable": variable,
        "value": value,
        "answers": answers or [],
        "completed": completed,
        "source": "flowbot-backend",
    }
