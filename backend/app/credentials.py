"""Armazenamento de credenciais de integrações no banco de dados.

Todas as chaves de integração ficam na tabela `IntegrationConfig` e são
gerenciadas pela UI em /integrations. Não há leitura de `.env`/variáveis de
ambiente para credenciais: o banco é a única fonte权威 de verdade.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app.db import SessionLocal
from app.models import IntegrationConfig

# Campos tratados como secretos (mascarados nas respostas GET)
SECRET_KEYS = {
    "bot_token",
    "auth_token",
    "account_sid",
    "smtp_password",
    "smtp_user",
    "sendgrid_api_key",
    "default_secret",
    "webhook_secret",
    "mercadopago_access_token",
    "credentials_json",
    "openai_api_key",
    "anthropic_api_key",
    "google_ai_api_key",
    "deepseek_api_key",
    "groq_api_key",
    "mistral_api_key",
    "openrouter_api_key",
    "together_api_key",
    "perplexity_api_key",
    "xai_api_key",
    "azure_api_key",
    "pagseguro_token",
    "pagarme_api_key",
    "asaas_api_key",
    "paypal_client_id",
    "paypal_secret",
}


def _db_config(name: str) -> dict | None:
    try:
        with SessionLocal() as db:
            row = db.get(IntegrationConfig, name)
            if row and row.config:
                return json.loads(row.config)
    except Exception:
        return None
    return None


def get_credentials(name: str) -> dict[str, Any]:
    """Retorna as credenciais da integração salvas no banco (ou {} se vazia)."""
    return _db_config(name) or {}


def get_runtime_dispatch() -> list[str]:
    """Lista de integrações disparadas automaticamente a cada resposta."""
    cfg = get_credentials("runtime_dispatch")
    if cfg and cfg.get("integrations"):
        vals = cfg["integrations"]
        if isinstance(vals, str):
            return [v.strip() for v in vals.split(",") if v.strip()]
        return [str(v) for v in vals]
    return []


def set_runtime_dispatch(names: list[str]) -> None:
    save_credentials("runtime_dispatch", {"integrations": names}, enabled=True)


def list_integrations() -> list[dict[str, Any]]:
    """Lista todas as integrações com config (secrets mascarados)."""
    from app.integrations import available

    result = []
    names = set(available())
    try:
        with SessionLocal() as db:
            for row in db.scalars(select(IntegrationConfig)).all():
                names.add(row.id)
    except Exception:
        pass
    for name in sorted(names):
        cfg = get_credentials(name)
        masked = {k: ("••••••" if k in SECRET_KEYS and v else v) for k, v in cfg.items()}
        result.append(
            {
                "name": name,
                "enabled": bool(cfg),
                "config": masked,
            }
        )
    return result


def save_credentials(name: str, config: dict[str, Any], enabled: bool = True) -> dict[str, Any]:
    """Salva (mescla) credenciais. Valores vazios removidos; ausentes mantidos."""
    with SessionLocal() as db:
        row = db.get(IntegrationConfig, name)
        base: dict[str, Any] = json.loads(row.config) if row else {}
        for k, v in (config or {}).items():
            if v is None or v == "":
                base.pop(k, None)
            else:
                base[k] = v
        if row:
            row.config = json.dumps(base, ensure_ascii=False)
            row.enabled = enabled
            row.updatedAt = datetime.now(timezone.utc).isoformat()
        else:
            db.add(
                IntegrationConfig(
                    id=name,
                    config=json.dumps(base, ensure_ascii=False),
                    enabled=enabled,
                    updatedAt=datetime.now(timezone.utc).isoformat(),
                )
            )
        db.commit()
        return {"name": name, "enabled": enabled, "config": base}


def delete_credentials(name: str) -> None:
    with SessionLocal() as db:
        row = db.get(IntegrationConfig, name)
        if row:
            db.delete(row)
            db.commit()


__all__ = [
    "get_credentials",
    "get_runtime_dispatch",
    "set_runtime_dispatch",
    "list_integrations",
    "save_credentials",
    "delete_credentials",
    "SECRET_KEYS",
]
