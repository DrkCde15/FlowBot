"""CRUD de credenciais de integrações salvas no banco de dados.

GET  /api/v1/integrations            -> lista (secrets mascarados)
PUT  /api/v1/integrations/{name}     -> salva/mescla credenciais
DELETE /api/v1/integrations/{name}   -> remove credenciais
PUT  /api/v1/integrations/_dispatch  -> define integrações de dispatch automático
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.credentials import (
    delete_credentials,
    list_integrations,
    save_credentials,
    set_runtime_dispatch,
)

router = APIRouter(prefix="/api/v1/integrations", tags=["integrations"])


@router.get("")
async def get_all() -> dict[str, Any]:
    return {"integrations": list_integrations(), "dispatch": get_runtime_dispatch()}


@router.put("/{name}")
async def save(name: str, body: dict[str, Any]) -> dict[str, Any]:
    if name.startswith("_"):
        raise ValueError("nome de integração inválido")
    config = body.get("config", body)
    enabled = bool(body.get("enabled", True))
    return save_credentials(name, config, enabled=enabled)


@router.delete("/{name}")
async def delete(name: str) -> dict[str, Any]:
    delete_credentials(name)
    return {"deleted": name}


@router.put("/_dispatch")
async def set_dispatch(body: dict[str, Any]) -> dict[str, Any]:
    names = body.get("integrations") or []
    set_runtime_dispatch([str(n) for n in names])
    return {"integrations": names}


__all__ = ["router"]
