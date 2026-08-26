"""Adapters que expõem as ações do runtime na lista de integrações.

Permitem disparar essas ações tanto via bloco do builder (endpoint /action)
quanto via `POST /api/v1/tasks/dispatch` (passando `_config` no evento).
"""
from typing import Any

from app.actions import run_action
from app.integrations.base import IntegrationAdapter


class _ActionAdapter(IntegrationAdapter):
    action_type: str = ""

    async def send(self, event: dict[str, Any]) -> None:
        config = event.get("_config") or {}
        context = {
            "variables": {
                a.get("variable"): a.get("value")
                for a in event.get("answers", [])
                if isinstance(a, dict) and a.get("variable")
            },
            "conversation_id": event.get("conversation_id"),
            "bot_slug": event.get("bot_slug"),
            "bot_name": event.get("bot_name"),
        }
        await run_action(self.action_type, config, context)


class AIAdapter(_ActionAdapter):
    name = "ai"
    action_type = "ai"


class GoogleSheetsAdapter(_ActionAdapter):
    name = "google_sheets"
    action_type = "google_sheets"


class GoogleDocsAdapter(_ActionAdapter):
    name = "google_docs"
    action_type = "google_docs"


class HTTPAdapter(_ActionAdapter):
    name = "http"
    action_type = "http"


class PaymentAdapter(_ActionAdapter):
    name = "payment"
    action_type = "payment"


class MemoryAdapter(_ActionAdapter):
    name = "memory"
    action_type = "memory"


class FileAdapter(_ActionAdapter):
    name = "file"
    action_type = "file"
