from app.credentials import get_credentials
from app.integrations.base import IntegrationAdapter


class CrmAdapter(IntegrationAdapter):
    name = "crm"

    async def send(self, event: dict) -> None:
        creds = get_credentials("crm")
        await self._post_json(creds.get("webhook_url"), event, creds.get("webhook_secret"))
