# FlowBot Python backend

Camada de **segurança, orquestração e integrações** para o FlowBot (Next.js).
Serviço FastAPI independente que atua como orquestrador do chat ao vivo e como
serviço de tarefas/dispatcher de integrações.

## O que ele faz

- **Orquestração (BFF):** recebe o chat ao vivo (`/api/v1/runtime/{slug}/...`),
  roda o motor de fluxo (port do `lib/engine.ts`), lê os bots e grava
  `Conversation`/`Answer` no mesmo SQLite do Prisma.
- **Segurança:** rate limiting por IP, sanitização de input, verificação HMAC
  de webhooks de entrada, CORS configurável e credenciais de integração salvas
  no **banco de dados** (tabela `IntegrationConfig`) — não mais em `.env`.
- **Tarefas/integrações:** dispatcher plugável. O Next.js chama
  `POST /api/v1/tasks/dispatch` e o runtime dispara integrações automaticamente
  (lista definida em `runtime_dispatch` no banco, configurável na UI
  `/integrations`).

## Integrações disponíveis

**Notificação (dispatcher):** `webhook` (HTTP genérico), `n8n`, `slack`,
`discord`, `telegram`, `whatsapp` (Twilio), `email` (SMTP ou SendGrid) e
`crm` (webhook genérico).

**Ações executadas no runtime (blocos do builder):** `ai` (OpenAI, Anthropic,
Google/Gemini, DeepSeek, Groq, Mistral, OpenRouter, Together, Perplexity, xAI,
Ollama e qualquer endpoint custom compatível com a API Chat Completions —
com contador de tokens), `google_sheets`, `google_docs`, `http` (requisição
genérica com body/headers opcionais), `payment` (Mercado Pago, PagSeguro,
Pagar.me, Asaas, PayPal ou link manual — substitui o Stripe), `memory`
(SQLite; outros bancos pedem auth) e `file` (import/export).

Adicione novas implementando `IntegrationAdapter` em `app/integrations/` ou
handlers em `app/actions/execute.py` (função `run_action`).

## Setup local

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

As credenciais de integração são cadastradas pela UI em **/integrations** e
persistidas no banco (tabela `IntegrationConfig`). Não há arquivo `.env` nem
variáveis de ambiente para segredos de integração — apenas configuração de
infraestrutura (ex: `DATABASE_URL`, `CORS_ALLOW_ORIGINS`) vem do ambiente da
aplicação no deploy.

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
| POST | `/api/v1/runtime/{slug}/action` | executa um bloco de ação (IA, pagamento, Google, HTTP, memória, etc.) |
| GET | `/api/v1/tasks/integrations` | lista adaptadores disponíveis |
| POST | `/api/v1/tasks/dispatch` | dispara integrações manualmente |
| GET | `/api/v1/files/export` | exporta bot (JSON) ou respostas (CSV) por `?slug=&format=` |
| POST | `/api/v1/files/import` | importa um fluxo de bot a partir de JSON |
| GET | `/api/v1/integrations` | lista integrações salvas (secrets mascarados) + `dispatch` |
| PUT | `/api/v1/integrations/{name}` | salva/mescla credenciais de uma integração |
| DELETE | `/api/v1/integrations/{name}` | remove credenciais de uma integração |
| PUT | `/api/v1/integrations/_dispatch` | define integrações de dispatch automático |
| POST | `/api/v1/webhooks/{provider}` | webhook de entrada (verificado por HMAC) |

### Credenciais no banco (sem `.env`)

Todas as chaves de integração são gerenciadas pela UI em **`/integrations`**
(e o Next faz proxy para `/api/v1/integrations`). Cada integração tem um nome
(`telegram`, `whatsapp`, `slack`, `discord`, `email`, `webhook`, `n8n`, `crm`,
`ai`, `payment`, `google`, `memory`) e um objeto `config`. Os valores são
persistidos **apenas** na tabela `IntegrationConfig` — não há leitura de `.env`
nem de variáveis de ambiente para segredos. Segredos são mascarados (`••••••`)
nas respostas GET. Envie apenas os campos alterados: valores vazios são
ignorados (mantêm o existente) e campos ausentes são preservados.

## Exemplo: disparar integração manualmente

```bash
curl -X POST http://localhost:8000/api/v1/tasks/dispatch \
  -H 'content-type: application/json' \
  -d '{"integrations":["slack","n8n"],"event":{"bot_slug":"demo","bot_name":"Demo","conversation_id":"x","variable":"email","value":"a@b.com"}}'
```

## Docker

O `docker-compose.yml` na raiz sobe o serviço `backend` junto do Next.js,
compartilhando o volume do banco.
