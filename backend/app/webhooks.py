import json

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.credentials import get_credentials
from app.security import rate_limited, verify_signature

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.post("/{provider}")
async def inbound_webhook(
    provider: str,
    request: Request,
    _: None = Depends(rate_limited("webhook")),
) -> JSONResponse:
    raw = await request.body()
    secret = _secret_for(provider)
    verify_signature(secret, raw, request.headers.get("X-FlowBot-Signature"))
    payload = json.loads(raw) if raw else {}
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"received": True, "provider": provider, "event": payload.get("type")},
    )


def _secret_for(provider: str) -> str:
    creds = get_credentials(provider)
    return creds.get("webhook_secret") or settings.integrations_secret
