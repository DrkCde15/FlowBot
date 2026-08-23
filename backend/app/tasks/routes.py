from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from app.integrations import available
from app.security import rate_limited, verify_signature
from app.tasks.dispatcher import dispatch

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("/integrations")
async def list_integrations() -> dict[str, Any]:
    return {"integrations": available()}


@router.post("/dispatch")
async def dispatch_task(request: Request, _: None = None) -> dict[str, Any]:
    body = await request.json()
    integrations = body.get("integrations") or []
    event = body.get("event") or {}
    if not integrations:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="integrations required")
    results = await dispatch(integrations, event)
    return {"results": results}
