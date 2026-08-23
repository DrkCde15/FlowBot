from app.config import settings
from app.integrations.base import IntegrationAdapter


class WebhookAdapter(IntegrationAdapter):
    name = "webhook"

    async def send(self, event: dict) -> None:
        url = event.get("_target_url") or settings.webhook_default_url
        secret = event.get("_target_secret") or settings.webhook_default_secret
        await self._post_json(url, event, secret)


class N8nAdapter(IntegrationAdapter):
    name = "n8n"

    async def send(self, event: dict) -> None:
        await self._post_json(settings.n8n_webhook_url, event, settings.n8n_webhook_secret)
