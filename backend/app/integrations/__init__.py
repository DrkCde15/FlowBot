from app.integrations.base import IntegrationAdapter, build_event
from app.integrations.webhook import WebhookAdapter, N8nAdapter
from app.integrations.slack import SlackAdapter
from app.integrations.discord import DiscordAdapter
from app.integrations.telegram import TelegramAdapter
from app.integrations.whatsapp import WhatsAppAdapter
from app.integrations.email import EmailAdapter
from app.integrations.crm import CrmAdapter
from app.integrations.actions import (
    AIAdapter,
    FileAdapter,
    GoogleDocsAdapter,
    GoogleSheetsAdapter,
    HTTPAdapter,
    MemoryAdapter,
    PaymentAdapter,
)

_REGISTRY: dict[str, IntegrationAdapter] = {
    adapter.name: adapter()
    for adapter in (
        WebhookAdapter,
        N8nAdapter,
        SlackAdapter,
        DiscordAdapter,
        TelegramAdapter,
        WhatsAppAdapter,
        EmailAdapter,
        CrmAdapter,
        # ações / integrações avançadas
        AIAdapter,
        GoogleSheetsAdapter,
        GoogleDocsAdapter,
        HTTPAdapter,
        PaymentAdapter,
        MemoryAdapter,
        FileAdapter,
    )
}


def get_adapter(name: str) -> IntegrationAdapter | None:
    return _REGISTRY.get(name)


def available() -> list[str]:
    return sorted(_REGISTRY.keys())


__all__ = ["get_adapter", "available"]
