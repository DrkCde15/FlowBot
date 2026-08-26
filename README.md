# FlowBot

A self-hostable, visual chatbot / conversational-flow builder — like Typeform but for chat bots.

- **Frontend:** Next.js 14 (App Router) + Prisma + SQLite + Tailwind CSS (`frontend/`)
- **Backend:** FastAPI service for **security, orchestration and external integrations** (`backend/`)

The Next.js app owns the visual editor and bot persistence. The Python service
acts as the chat **orchestrator** (runs the flow engine, stores conversations) and
as a **task/integration layer** (webhooks, Slack, Discord, Telegram, WhatsApp,
email, CRM). The two share a single SQLite database.

## Features

- 🧩 **Visual editor** — drag-and-drop blocks to build a conversational flow
  - Text messages, Images
  - User inputs: text / email / number / phone, Date picker, Buttons
  - **IA block** — chama APIs de IA (OpenAI, Anthropic, Google/Gemini, DeepSeek,
    Groq, Mistral, OpenRouter, Together, Perplexity, xAI, Ollama, custom) com
    seletor de modelo e contador de tokens
  - **Pagamento** — Mercado Pago, PagSeguro, Pagar.me, Asaas, PayPal ou link manual
  - **WhatsApp / Telegram** — envia mensagens durante o fluxo
  - **Google Sheets / Docs** — grava linhas e anexa texto (conta de serviço)
  - **HTTP** — requisições a outros sites (body e headers opcionais, auth básica)
  - **Memória** — persistência em SQLite (outros bancos pedem autenticação)
  - **Arquivo** — importação/exportação de fluxos e respostas
- 🔀 **Branching logic** — route the conversation based on the user's answer
- 🎨 **Theme customization** — colors, fonts, corner radius, bubble/popup, position
- 💻 **Embed anywhere** — copy one `<script>` tag to add a chat bubble / popup to any site
- 📊 **Dashboard + analytics** — conversations, completion rate, 14-day activity, and CSV export
- 🔒 **Python backend** — rate limiting, input sanitization, HMAC-verified webhooks,
  secret isolation, and a pluggable integration registry
- 🐳 **Easy Docker deploy** — both services in one compose file

## Architecture

```
Browser ──► Next.js (frontend/)  ── proxies /api/runtime/* ──► FastAPI (backend/)
                │                                                │
                └── writes bots (Prisma)                        └── reads bots, writes
                   SQLite ◄──────────── shared ────────────────  conversations + dispatches
                                                                  integrations
```

Single source of truth for bot definitions: the builder (Next) writes `Bot`,
the runtime (Python) reads `Bot` and writes `Conversation`/`Answer`.

## Quick start (local)

You need **two terminals** — the frontend proxies chat traffic to the backend.

**1. Frontend (Next.js, port 3000)**
```bash
cd frontend
npm install
npx prisma db push
npm run db:seed               # optional demo bot at /b/demo
npm run dev
```

**2. Backend (FastAPI, port 8000)**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
python3 -m pip install -r requirements.txt   # use `python3 -m pip`, not bare `pip`
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:3000 → redirected to the dashboard.
Health check: http://localhost:8000/health → `{"status":"ok"}`.

If the backend is down, the chat returns 502 (the frontend only proxies).

## Docker

```bash
docker compose up --build
```

Ships `app` (Next, :3000) and `backend` (FastAPI, :8000) sharing the `db-data`
volume. For production set `DATABASE_URL` and `INTEGRATIONS_SECRET` in the environment.

To switch to Postgres, change the `datasource` provider in `frontend/prisma/schema.prisma`
and point `DATABASE_URL` at your instance, then run `prisma db push`.

## Project layout

```
frontend/
  app/
    api/bots/…            bot CRUD + analytics + CSV export
    api/runtime/[slug]/…  proxies to the Python backend (start / answer / flow)
    api/integrations/…    lists + dispatches integrations via Python
    builder/[id]/         visual editor
    bots/[id]/analytics/  dashboard
    b/[slug]/             public bot page (used by embeds)
  components/
    ChatWidget.tsx        the chat runtime UI (preview, live, embed)
    builder/Builder.tsx   the visual editor
  lib/
    flow.ts               block + theme types
    engine.ts             next-block / branching logic
    prisma.ts             db client
    python_client.ts      HTTP client for the Python backend
  prisma/schema.prisma    data model
backend/
  app/
    config.py             pydantic-settings
    db.py, models.py      SQLAlchemy mirror of the Prisma tables
    engine/               port of lib/engine.ts (flow orchestration)
    security/             rate limit, HMAC verify, sanitize
    integrations/         webhook, n8n, slack, discord, telegram, whatsapp, email, crm
    runtime/routes.py     /api/v1/runtime/{slug}/start|answer
    tasks/                /api/v1/tasks/dispatch
    webhooks.py           HMAC-verified inbound webhooks
  README.md               backend-specific setup and integration reference
```

## Integrations

The Python backend ships a pluggable integration registry. Configure credentials
**in the database via the `/integrations` UI** (no `.env` file) and use them
either as **builder blocks** (executed when the conversation reaches that block
via `POST /api/v1/runtime/{slug}/action`) or as **notify integrations** fired
automatically via `POST /api/v1/tasks/dispatch` (the auto-dispatch list is also
set in the `/integrations` UI).

Available integrations: `webhook`, `n8n`, `slack`, `discord`, `telegram`,
`whatsapp`, `email`, `crm`, `ai` (OpenAI, Anthropic, Google/Gemini, DeepSeek,
Groq, Mistral, OpenRouter, Together, Perplexity, xAI, Ollama, custom),
`google_sheets`, `google_docs`, `http`, `payment` (Mercado Pago, PagSeguro,
Pagar.me, Asaas, PayPal, link manual), `memory`, `file`.

### Credenciais (cadastradas em /integrations, sem `.env`)
- **IA:** chaves por provedor (ex: `openai_api_key`, `anthropic_api_key`, …)
- **Pagamento:** token/secret por provedor (ex: `mercadopago_access_token`, `paypal_client_id`/`paypal_secret`, …)
- **Google Sheets/Docs:** `credentials_json` (service account completo)
- **WhatsApp:** Twilio (`account_sid`/`auth_token`/`from_number`) · **Telegram:** `bot_token` + `chat_id`
- **Memória:** SQLite nativo (sem auth); Postgres/MySQL exigem `connection`+`user`+`password`
- **Arquivos:** import/export via `POST /api/v1/files/import` e `GET /api/v1/files/export`

## Embedding a published bot

From the builder's **Embed** tab (publish the bot first):

```html
<script
  src="https://your-server/embed.js"
  data-slug="demo"
  data-type="bubble"
  data-position="right"
  data-bubble-text="Chat with us"
></script>
```

## Notes / limitations

- Authentication is **not** included (single-tenant / self-hosted assumption). Add auth
  before exposing publicly.
- Payments use **Mercado Pago** (ou link manual) — configure `MERCADOPAGO_ACCESS_TOKEN`.
  O bloco gera um link de checkout (`init_point`) que é exibido no chat.
- Answers are stored per-conversation; the CSV export pivots variables into columns.
- The runtime path depends on the Python backend. For a frontend-only mode you would
  revert the `/api/runtime/*` proxies to the original Next handlers.
