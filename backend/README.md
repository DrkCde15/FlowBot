# FlowBot Python backend

Camada de **segurança, orquestração e integrações** para o FlowBot (Next.js).
Serviço FastAPI independente que atua como orquestrador do chat ao vivo e como
serviço de tarefas/dispatcher de integrações.

## O que ele faz

- **Orquestração (BFF):** recebe o chat ao vivo (`/api/v1/runtime/{slug}/...`),
  roda o motor de fluxo (port do `lib/engine.ts`), lê os bots e grava
  `Conversation`/`Answer` no mesmo SQLite do Prisma.
- **Segurança:** rate limiting por IP, sanitização de input, verificação HMAC
  de webhooks de entrada, CORS configurável e segredos isolados em `.env`
  (nunca expostos ao browser).
- **Tarefas/integrações:** dispatcher plugável. O Next.js chama
  `POST /api/v1/tasks/dispatch` e o runtime dispara integrações automaticamente
  (via `RUNTIME_DISPATCH_INTEGRATIONS`).

## Integrações disponíveis

`webhook` (HTTP genérico), `n8n`, `slack`, `discord`, `telegram`, `whatsapp`
(Twilio), `email` (SMTP ou SendGrid) e `crm` (webhook genérico). Adicione novas
implementando `IntegrationAdapter` em `app/integrations/`.

## Setup local

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env      # DATABASE_URL aponta para ../data/dev.db
uvicorn app.main:app --reload --port 8000
```

`DATABASE_URL` default aponta para `../data/dev.db` (banco SQLite **neutro** na raiz
do repo, compartilhado com o Next.js). O backend garante o schema no startup
(`init_db` → `Base.metadata.create_all`), então ele cria as tabelas se o banco não
existir. Mantenha um único banco: o builder (Next) escreve bots, o runtime (Python)
lê bots e escreve conversas.

## Endpoints

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| GET | `/health` | healthcheck |
| GET | `/api/v1/runtime/{slug}` | flow + theme do bot publicado |
| POST | `/api/v1/runtime/{slug}/start` | cria conversa, retorna 1º bloco |
| POST | `/api/v1/runtime/{slug}/answer` | salva resposta, calcula próximo bloco |
| GET | `/api/v1/tasks/integrations` | lista adaptadores disponíveis |
| POST | `/api/v1/tasks/dispatch` | dispara integrações manualmente |
| POST | `/api/v1/webhooks/{provider}` | webhook de entrada (verificado por HMAC) |

## Exemplo: disparar integração manualmente

```bash
curl -X POST http://localhost:8000/api/v1/tasks/dispatch \
  -H 'content-type: application/json' \
  -d '{"integrations":["slack","n8n"],"event":{"bot_slug":"demo","bot_name":"Demo","conversation_id":"x","variable":"email","value":"a@b.com"}}'
```

## Docker

O `docker-compose.yml` na raiz sobe o serviço `backend` junto do Next.js,
compartilhando o volume do banco.
