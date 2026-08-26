from app.credentials import get_credentials
from app.integrations.base import IntegrationAdapter


class WebhookAdapter(IntegrationAdapter):
    name = "webhook"

    async def send(self, event: dict) -> None:
        creds = get_credentials("webhook")
        url = event.get("_target_url") or creds.get("default_url")
        secret = event.get("_target_secret") or creds.get("default_secret")
        await self._post_json(url, event, secret)


class N8nAdapter(IntegrationAdapter):
    name = "n8n"

    async def send(self, event: dict) -> None:
        creds = get_credentials("n8n")
        await self._post_json(creds.get("webhook_url"), event, creds.get("webhook_secret"))
