"""Execução de blocos de ação (integrações) no runtime do FlowBot.

Cada handler recebe o `config` do bloco (sub-objeto nomeado pelo tipo) e um
`context` com as variáveis coletadas na conversa. Retorna um dict:
    {"result": str, "tokens": {...}|None, "url": str|None, "variable": str|None,
     "value": str|None, "error": str|None}
"""
from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.actions.memory_db import _MEMORY_DB, memory_get, memory_list, memory_set
from app.actions.tokens import count_tokens
from app.credentials import get_credentials

_VAR_RE = re.compile(r"{{\s*([\w.]+)\s*}}")


def render(template: str, variables: dict[str, Any]) -> str:
    if not template:
        return ""
    def repl(m: re.Match) -> str:
        val = variables.get(m.group(1))
        return str(val) if val is not None else m.group(0)

    return _VAR_RE.sub(repl, template)


def _var_name(cfg: dict) -> str | None:
    return cfg.get("variable") or cfg.get("key")


# Provedores de IA suportados. "openai" compreende qualquer endpoint
# compatível com a API Chat Completions (DeepSeek, Groq, Mistral, OpenRouter,
# Together, Perplexity, xAI, Ollama, Azure...). Credenciais vêm da integração "ai".
AI_PROVIDERS: dict[str, dict] = {
    "openai": {"kind": "openai", "base": "https://api.openai.com/v1", "default_model": "gpt-4o-mini"},
    "anthropic": {"kind": "anthropic", "base": "https://api.anthropic.com/v1", "default_model": "claude-3-5-sonnet-20240620"},
    "google": {"kind": "google", "default_model": "gemini-1.5-flash"},
    "deepseek": {"kind": "openai", "base": "https://api.deepseek.com/v1", "default_model": "deepseek-chat"},
    "groq": {"kind": "openai", "base": "https://api.groq.com/openai/v1", "default_model": "llama-3.1-8b-instant"},
    "mistral": {"kind": "openai", "base": "https://api.mistral.ai/v1", "default_model": "mistral-large-latest"},
    "openrouter": {"kind": "openai", "base": "https://openrouter.ai/api/v1", "default_model": "openai/gpt-4o-mini"},
    "together": {"kind": "openai", "base": "https://api.together.xyz/v1", "default_model": "meta-llama/Llama-3.3-70B-Instruct-Turbo"},
    "perplexity": {"kind": "openai", "base": "https://api.perplexity.ai", "default_model": "sonar"},
    "xai": {"kind": "openai", "base": "https://api.x.ai/v1", "default_model": "grok-2"},
    "ollama": {"kind": "openai", "base": "http://localhost:11434/v1", "default_model": "llama3"},
    "azure": {"kind": "azure", "default_model": "gpt-4o-mini"},
    "custom": {"kind": "openai", "base": None, "default_model": ""},
}

# campo de credencial global usado por provedor (quando o card não traz a chave)
_AI_KEYFIELD = {
    "openai": "openai_api_key",
    "anthropic": "anthropic_api_key",
    "google": "google_ai_api_key",
    "azure": "azure_api_key",
    "custom": "custom_api_key",
}


def _ai_keyfield(provider: str) -> str:
    return _AI_KEYFIELD.get(provider, f"{provider}_api_key")


async def handle_ai(cfg: dict, ctx: dict) -> dict:
    creds = get_credentials("ai")
    provider = (cfg.get("provider") or creds.get("default_provider") or "openai").lower()
    spec = AI_PROVIDERS.get(provider, AI_PROVIDERS["custom"])
    model = cfg.get("model") or creds.get("default_model") or spec["default_model"]
    if not model and provider != "ollama":
        return {"error": f"Modelo não informado para o provedor '{provider}'"}
    sys_prompt = render(cfg.get("system") or "", ctx["variables"])
    prompt = render(cfg.get("prompt") or "", ctx["variables"])
    max_tokens = int(cfg.get("maxTokens") or 512)

    prompt_tokens = count_tokens(prompt + " " + sys_prompt, model)

    if spec["kind"] == "anthropic":
        api_key = cfg.get("apiKey") or creds.get("anthropic_api_key")
        if not api_key:
            return {"error": "anthropic: api key não informada no card nem na integração 'ai'"}
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{spec['base'].rstrip('/')}/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": max_tokens,
                    "system": sys_prompt,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            data = resp.json()
            text = "".join(part.get("text", "") for part in data.get("content", []))
            usage = data.get("usage", {})
            comp = int(usage.get("output_tokens", 0))
            total = int(usage.get("input_tokens", prompt_tokens)) + comp
        return _ai_result(text, prompt_tokens, comp, total, cfg)

    if spec["kind"] == "google":
        api_key = cfg.get("apiKey") or creds.get("google_ai_api_key")
        if not api_key:
            return {"error": "google: api key não informada no card nem na integração 'ai'"}
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                json={
                    "systemInstruction": {"parts": [{"text": sys_prompt}]} if sys_prompt else None,
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                },
            )
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            um = data.get("usageMetadata", {})
            comp = int(um.get("candidatesTokenCount", 0))
            total = int(um.get("promptTokenCount", prompt_tokens)) + comp
        return _ai_result(text, prompt_tokens, comp, total, cfg)

    # OpenAI-compatible (openai, deepseek, groq, mistral, openrouter, together,
    # perplexity, xai, ollama, azure, custom)
    if spec["kind"] == "azure":
        api_key = cfg.get("apiKey") or creds.get("azure_api_key")
        endpoint = cfg.get("endpoint") or creds.get("azure_endpoint")
        if not (api_key and endpoint):
            return {"error": "azure: api_key/endpoint não informados no card nem na integração 'ai'"}
        url = f"{endpoint.rstrip('/')}/openai/deployments/{model}/chat/completions?api-version=2024-02-15-preview"
        headers = {"api-key": api_key, "content-type": "application/json"}
    else:
        base = cfg.get("baseUrl") or creds.get(f"{provider}_base_url") or spec.get("base")
        if not base:
            return {"error": f"{provider}: base_url não informado no card nem na integração 'ai'"}
        api_key = cfg.get("apiKey") or creds.get(_ai_keyfield(provider))
        if not api_key and provider != "ollama":
            return {"error": f"{provider}: api key não informada no card nem na integração 'ai'"}
        url = f"{base.rstrip('/')}/chat/completions"
        headers = {"Authorization": f"Bearer {api_key or ''}", "content-type": "application/json"}

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            url,
            headers=headers,
            json={
                "model": model,
                "max_tokens": max_tokens,
                "messages": [
                    *([{"role": "system", "content": sys_prompt}] if sys_prompt else []),
                    {"role": "user", "content": prompt},
                ],
            },
        )
        data = resp.json()
        text = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        comp = int(usage.get("completion_tokens", 0))
        total = int(usage.get("total_tokens", prompt_tokens + comp))
    return _ai_result(text, prompt_tokens, comp, total, cfg)


def _ai_result(text: str, prompt_tokens: int, comp: int, total: int, cfg: dict) -> dict:
    return {
        "result": text.strip(),
        "tokens": {"prompt": prompt_tokens, "completion": comp, "total": total},
        "variable": _var_name(cfg),
        "value": text.strip(),
    }


async def handle_whatsapp(cfg: dict, ctx: dict) -> dict:
    creds = get_credentials("whatsapp")
    sid = creds.get("account_sid")
    token = creds.get("auth_token")
    from_number = creds.get("from_number")
    to = render(cfg.get("to") or "", ctx["variables"])
    text = render(cfg.get("message") or "", ctx["variables"])
    if not (sid and token and to):
        return {"error": "WhatsApp (Twilio) não configurado: SID/Auth/To ausentes"}
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    data = {
        "From": f"whatsapp:{from_number}",
        "To": f"whatsapp:{to}",
        "Body": text,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, data=data, auth=(sid, token))
    return {"result": "Mensagem WhatsApp enviada"}


async def handle_telegram(cfg: dict, ctx: dict) -> dict:
    creds = get_credentials("telegram")
    chat_id = render(cfg.get("to") or cfg.get("chatId") or creds.get("chat_id") or "", ctx["variables"])
    text = render(cfg.get("message") or "", ctx["variables"])
    token = creds.get("bot_token")
    if not (token and chat_id):
        return {"error": "Telegram não configurado: token/chat_id ausentes"}
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json={"chat_id": chat_id, "text": text})
    return {"result": "Mensagem Telegram enviada"}


async def handle_google_sheets(cfg: dict, ctx: dict) -> dict:
    creds = get_credentials("google")
    sid = render(cfg.get("spreadsheetId") or "", ctx["variables"])
    sheet = cfg.get("sheet") or "Sheet1"
    raw = render(cfg.get("values") or "", ctx["variables"])
    if not sid:
        return {"error": "google_sheets: spreadsheetId ausente"}
    row = [c.strip() for c in raw.split(",")] if raw else [""]
    from app.actions.google_auth import build_google_service

    try:
        service = build_google_service("sheets", "v4", creds.get("credentials_json"))
    except RuntimeError as exc:
        return {"error": str(exc)}
    service.spreadsheets().values().append(
        spreadsheetId=sid,
        range=sheet,
        valueInputOption="USER_ENTERED",
        body={"values": [row]},
    ).execute()
    return {"result": f"Linha adicionada à planilha ({sheet})"}


async def handle_google_docs(cfg: dict, ctx: dict) -> dict:
    creds = get_credentials("google")
    did = render(cfg.get("documentId") or "", ctx["variables"])
    text = render(cfg.get("text") or "", ctx["variables"])
    if not did:
        return {"error": "google_docs: documentId ausente"}
    from app.actions.google_auth import build_google_service

    try:
        service = build_google_service("docs", "v1", creds.get("credentials_json"))
    except RuntimeError as exc:
        return {"error": str(exc)}
    doc = service.documents().get(documentId=did).execute()
    end_index = doc.get("body", {}).get("content", [{}])[-1].get("endIndex", 1)
    service.documents().batchUpdate(
        documentId=did,
        body={
            "requests": [
                {"insertText": {"location": {"index": max(1, end_index - 1)}, "text": text}}
            ]
        },
    ).execute()
    return {"result": "Texto anexado ao Google Doc"}


async def handle_http(cfg: dict, ctx: dict) -> dict:
    method = (cfg.get("method") or "POST").upper()
    url = render(cfg.get("url") or "", ctx["variables"])
    if not url:
        return {"error": "http: url ausente"}
    try:
        headers = json.loads(cfg.get("headers") or "{}") or {}
    except Exception:
        headers = {}
    body = render(cfg.get("body") or "", ctx["variables"]) if cfg.get("body") else None
    auth = (cfg.get("authUser"), cfg.get("authPass")) if cfg.get("authUser") else None

    async with httpx.AsyncClient(timeout=20) as client:
        if body is not None:
            try:
                parsed = json.loads(body)
                resp = await client.request(method, url, json=parsed, headers=headers, auth=auth)
            except Exception:
                resp = await client.request(method, url, content=body, headers=headers, auth=auth)
        else:
            resp = await client.request(method, url, headers=headers, auth=auth)
    snippet = resp.text[:500]
    return {"result": f"[{resp.status_code}] {snippet}", "status": resp.status_code}


PAYMENT_PROVIDERS = ["mercadopago", "pagseguro", "pagarme", "asaas", "paypal", "link"]


def _find_url(obj, _depth: int = 0) -> str | None:
    """Procura o primeiro campo que pareça ser uma URL de checkout/pagamento."""
    if _depth > 6:
        return None
    if isinstance(obj, dict):
        for k, v in obj.items():
            kl = k.lower()
            if isinstance(v, str) and v.startswith("http") and any(
                s in kl for s in ("url", "link", "point", "href", "checkout", "pay", "invoice", "approve")
            ):
                return v
            found = _find_url(v, _depth + 1)
            if found:
                return found
    elif isinstance(obj, list):
        for item in obj:
            found = _find_url(item, _depth + 1)
            if found:
                return found
    return None


async def handle_payment(cfg: dict, ctx: dict) -> dict:
    creds = get_credentials("payment")
    provider = (cfg.get("provider") or creds.get("provider") or "mercadopago").lower()
    amount = int(cfg.get("amount") or 1000)
    currency = (cfg.get("currency") or creds.get("currency") or "BRL").upper()
    description = render(cfg.get("description") or "Pagamento", ctx["variables"])

    if provider == "link":
        url = render(cfg.get("url") or "", ctx["variables"])
        if not url:
            return {"error": "payment(link): url ausente"}
        return {"result": "Abra o link para pagar", "url": url, "variable": _var_name(cfg), "value": url}

    if provider == "mercadopago":
        token = creds.get("mercadopago_access_token")
        if not token:
            return {"error": "Pagamentos: mercadopago_access_token não configurado na integração 'payment'"}
        body = {
            "items": [
                {
                    "title": description,
                    "quantity": 1,
                    "currency_id": currency,
                    "unit_price": amount / 100.0,
                }
            ],
            "external_reference": ctx.get("conversation_id", ""),
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.mercadopago.com/checkout/preferences",
                json=body,
                headers={"Authorization": f"Bearer {token}"},
            )
            data = resp.json()
        url = data.get("init_point")
        if not url:
            return {"error": f"Mercado Pago: {data}", "status": resp.status_code}
        return {"result": "Abra o link para pagar", "url": url, "variable": _var_name(cfg), "value": url}

    if provider == "paypal":
        client_id = creds.get("paypal_client_id")
        secret = creds.get("paypal_secret")
        if not (client_id and secret):
            return {"error": "Pagamentos: paypal_client_id/secret não configurados na integração 'payment'"}
        async with httpx.AsyncClient(timeout=20) as client:
            auth = __import__("base64").b64encode(f"{client_id}:{secret}".encode()).decode()
            token_resp = await client.post(
                "https://api-m.paypal.com/v1/oauth2/token",
                data={"grant_type": "client_credentials"},
                headers={"Authorization": f"Basic {auth}"},
            )
            access = token_resp.json().get("access_token")
            if not access:
                return {"error": f"PayPal auth: {token_resp.json()}"}
            resp = await client.post(
                "https://api-m.paypal.com/v2/checkout/orders",
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [
                        {"amount": {"currency_code": currency, "value": f"{amount / 100:.2f}"}}
                    ],
                },
                headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"},
            )
            data = resp.json()
        url = next((l["href"] for l in data.get("links", []) if l.get("rel") == "approve"), None)
        if not url:
            return {"error": f"PayPal: {data}", "status": resp.status_code}
        return {"result": "Abra o link para pagar", "url": url, "variable": _var_name(cfg), "value": url}

    if provider == "pagseguro":
        token = creds.get("pagseguro_token")
        base = creds.get("pagseguro_base_url") or "https://api.pagseguro.com"
        if not token:
            return {"error": "Pagamentos: pagseguro_token não configurado na integração 'payment'"}
        body = {
            "reference_id": ctx.get("conversation_id", ""),
            "description": description,
            "amount": {"value": amount},
            "payment_method": {"type": "BOLETO", "boleto": {"due_date": ""}},
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"{base.rstrip('/')}/charges",
                json=body,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            data = resp.json()
        url = _find_url(data) or next(
            (l.get("href") for l in data.get("links", []) if l.get("rel") == "PAY"), None
        )
        if not url:
            return {"error": f"PagSeguro: {data}", "status": resp.status_code}
        return {"result": "Abra o link para pagar", "url": url, "variable": _var_name(cfg), "value": url}

    if provider == "asaas":
        token = creds.get("asaas_api_key")
        base = creds.get("asaas_base_url") or "https://www.asaas.com/api/v3"
        if not token:
            return {"error": "Pagamentos: asaas_api_key não configurado na integração 'payment'"}
        body = {
            "name": description,
            "description": description,
            "value": amount / 100.0,
            "billingType": "UNDEFINED",
            "chargeType": "DETACHED",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"{base.rstrip('/')}/paymentLinks",
                json=body,
                headers={"access_token": token, "Content-Type": "application/json"},
            )
            data = resp.json()
        url = data.get("url") or _find_url(data)
        if not url:
            return {"error": f"Asaas: {data}", "status": resp.status_code}
        return {"result": "Abra o link para pagar", "url": url, "variable": _var_name(cfg), "value": url}

    if provider == "pagarme":
        key = creds.get("pagarme_api_key")
        base = creds.get("pagarme_base_url") or "https://api.pagar.me/core/v5"
        if not key:
            return {"error": "Pagamentos: pagarme_api_key não configurado na integração 'payment'"}
        body = {
            "items": [{"amount": amount, "description": description, "quantity": 1}],
            "metadata": {"conversation_id": ctx.get("conversation_id", "")},
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"{base.rstrip('/')}/orders",
                json=body,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            )
            data = resp.json()
        url = data.get("checkout_url") or _find_url(data)
        if not url:
            return {"error": f"Pagar.me: {data}", "status": resp.status_code}
        return {"result": "Abra o link para pagar", "url": url, "variable": _var_name(cfg), "value": url}

    return {"error": f"provedor de pagamento desconhecido: {provider}"}


async def handle_memory(cfg: dict, ctx: dict) -> dict:
    creds = get_credentials("memory")
    db_type = (cfg.get("dbType") or "sqlite").lower()
    if db_type != "sqlite":
        # outros bancos exigem autenticação explícita
        if not (cfg.get("connection") and cfg.get("user") and cfg.get("password")):
            return {"error": f"banco '{db_type}' exige connection/user/password (autenticação)"}
        return {"error": f"banco '{db_type}' ainda não suportado (apenas sqlite nativo)"}

    db_path = creds.get("db_path") or str(_MEMORY_DB)
    op = (cfg.get("operation") or "set").lower()
    key = cfg.get("key") or ""
    if not key:
        return {"error": "memory: key ausente"}
    if op == "set":
        value = render(cfg.get("value") or "", ctx["variables"])
        memory_set(key, value, db_path)
        return {"result": "Memória gravada", "variable": key, "value": value}
    if op == "get":
        value = memory_get(key, db_path)
        return {"result": value or "", "variable": key, "value": value}
    if op == "list":
        rows = memory_list(db_path)
        return {"result": "\n".join(f"{r['key']}={r['value']}" for r in rows)}
    return {"error": f"operação de memória desconhecida: {op}"}


async def handle_file(cfg: dict, ctx: dict) -> dict:
    op = cfg.get("operation") or "export_json"
    slug = ctx.get("bot_slug", "")
    if op == "export_csv":
        return {"url": f"/api/files/export?slug={slug}&format=csv", "result": "Export CSV pronto"}
    return {"url": f"/api/files/export?slug={slug}&format=json", "result": "Export JSON pronto"}


HANDLERS = {
    "ai": handle_ai,
    "whatsapp": handle_whatsapp,
    "telegram": handle_telegram,
    "google_sheets": handle_google_sheets,
    "google_docs": handle_google_docs,
    "http": handle_http,
    "payment": handle_payment,
    "memory": handle_memory,
    "file": handle_file,
}


async def run_action(action_type: str, config: dict | None, context: dict) -> dict:
    handler = HANDLERS.get(action_type)
    if not handler:
        return {"error": f"ação desconhecida: {action_type}"}
    ctx = {
        "variables": (context or {}).get("variables", {}) or {},
        "conversation_id": (context or {}).get("conversation_id"),
        "bot_slug": (context or {}).get("bot_slug"),
        "bot_name": (context or {}).get("bot_name"),
    }
    try:
        return await handler(config or {}, ctx)
    except Exception as exc:  # integrações não devem quebrar o runtime
        return {"error": str(exc)}


__all__ = ["run_action", "HANDLERS", "render"]
