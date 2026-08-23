from app.config import settings
from app.integrations.base import IntegrationAdapter


class CrmAdapter(IntegrationAdapter):
    name = "crm"

    async def send(self, event: dict) -> None:
        await self._post_json(settings.crm_webhook_url, event, settings.crm_webhook_secret)
