"use client";

import { Block, Branch } from "@/lib/flow";
import { nanoid } from "nanoid";

export default function BlockInspector({
  block,
  onChange,
  onRemove,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
}) {
  const setBranch = (id: string, patch: Partial<Branch>) =>
    onChange({
      branches: (block.branches || []).map((b) =>
        b.id === id ? { ...b, ...patch } : b
      ),
    });

  const isBranch =
    block.type === "input" || block.type === "buttons" || block.type === "date";

  // helper para editar a config aninhada de um bloco de ação
  const setCfg = <K extends string>(field: K, value: unknown) =>
    onChange({
      [block.type]: { ...(block[block.type as keyof Block] as object), [field]: value },
    } as Partial<Block>);

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-gray-400">
          {block.type} block
        </span>
        <button onClick={onRemove} className="text-red-500">
          Delete
        </button>
      </div>

      {block.type === "text" && (
        <textarea
          value={block.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          className="w-full rounded border p-2"
          rows={3}
        />
      )}

      {block.type === "image" && (
        <input
          value={block.url || ""}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="Image URL"
          className="w-full rounded border p-1"
        />
      )}

      {(block.type === "input" ||
        block.type === "buttons" ||
        block.type === "date") && (
        <input
          value={block.label || ""}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Question / label"
          className="w-full rounded border p-1"
        />
      )}

      {block.type === "input" && (
        <div className="flex gap-2">
          <input
            value={block.placeholder || ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Placeholder"
            className="flex-1 rounded border p-1"
          />
          <select
            value={block.inputKind || "text"}
            onChange={(e) => onChange({ inputKind: e.target.value as any })}
            className="rounded border p-1"
          >
            <option value="text">text</option>
            <option value="email">email</option>
            <option value="number">number</option>
            <option value="phone">phone</option>
          </select>
          <input
            value={block.variable || ""}
            onChange={(e) => onChange({ variable: e.target.value })}
            placeholder="var"
            className="w-20 rounded border p-1"
          />
        </div>
      )}

      {block.type === "buttons" && (
        <div className="space-y-1">
          {(block.options || []).map((o, i) => (
            <div key={o.id} className="flex gap-1">
              <input
                value={o.label}
                onChange={(e) => {
                  const opts = [...(block.options || [])];
                  opts[i] = { ...o, label: e.target.value };
                  onChange({ options: opts });
                }}
                className="flex-1 rounded border p-1"
              />
              <input
                value={o.value}
                onChange={(e) => {
                  const opts = [...(block.options || [])];
                  opts[i] = { ...o, value: e.target.value };
                  onChange({ options: opts });
                }}
                className="w-24 rounded border p-1"
              />
              <button
                onClick={() =>
                  onChange({ options: block.options?.filter((x) => x.id !== o.id) })
                }
                className="text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onChange({
                options: [
                  ...(block.options || []),
                  { id: nanoid(6), label: "Option", value: "value" },
                ],
              })
            }
            className="text-xs text-indigo-600"
          >
            + Add option
          </button>
        </div>
      )}

      {block.type === "payment" && (
        <div className="space-y-2">
          <select
            value={block.payment?.provider || "mercadopago"}
            onChange={(e) => setCfg("provider", e.target.value)}
            className="w-full rounded border p-1"
          >
            <option value="mercadopago">Mercado Pago</option>
            <option value="pagseguro">PagSeguro</option>
            <option value="pagarme">Pagar.me (Stone)</option>
            <option value="asaas">Asaas</option>
            <option value="paypal">PayPal</option>
            <option value="link">Link manual</option>
          </select>
          {block.payment?.provider === "link" ? (
            <input
              value={block.payment?.url || ""}
              onChange={(e) => setCfg("url", e.target.value)}
              placeholder="URL de pagamento"
              className="w-full rounded border p-1"
            />
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                value={block.payment?.amount || 0}
                onChange={(e) => setCfg("amount", Number(e.target.value))}
                className="w-28 rounded border p-1"
                placeholder="centavos"
              />
              <input
                value={block.payment?.currency || "BRL"}
                onChange={(e) => setCfg("currency", e.target.value)}
                className="w-20 rounded border p-1"
              />
            </div>
          )}
          <input
            value={block.payment?.description || ""}
            onChange={(e) => setCfg("description", e.target.value)}
            placeholder="Descrição"
            className="w-full rounded border p-1"
          />
          <input
            value={block.payment?.variable || ""}
            onChange={(e) => setCfg("variable", e.target.value)}
            placeholder="var (salva a URL)"
            className="w-full rounded border p-1"
          />
          <p className="text-xs text-gray-400">
            Chaves configuradas em <b>Integrações → payment</b> (sem .env).
          </p>
        </div>
      )}

      {block.type === "ai" && (
        <div className="space-y-2">
          <select
            value={block.ai?.provider || "openai"}
            onChange={(e) => setCfg("provider", e.target.value)}
            className="w-full rounded border p-1"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google AI (Gemini)</option>
            <option value="deepseek">DeepSeek</option>
            <option value="groq">Groq</option>
            <option value="mistral">Mistral</option>
            <option value="openrouter">OpenRouter</option>
            <option value="together">Together</option>
            <option value="perplexity">Perplexity</option>
            <option value="xai">xAI (Grok)</option>
            <option value="ollama">Ollama (local)</option>
            <option value="azure">Azure OpenAI</option>
            <option value="custom">Custom (OpenAI-compatible)</option>
          </select>
          <input
            value={block.ai?.model || "gpt-4o-mini"}
            onChange={(e) => setCfg("model", e.target.value)}
            placeholder="modelo (ex: gpt-4o-mini)"
            className="w-full rounded border p-1"
          />
          <input
            type="password"
            value={block.ai?.apiKey || ""}
            onChange={(e) => setCfg("apiKey", e.target.value)}
            placeholder="API Key (opcional — usa a da Integrações se vazio)"
            className="w-full rounded border p-1"
          />
          <input
            value={block.ai?.baseUrl || ""}
            onChange={(e) => setCfg("baseUrl", e.target.value)}
            placeholder="Base URL (opcional — p/ custom/ollama)"
            className="w-full rounded border p-1"
          />
          {block.ai?.provider === "azure" && (
            <input
              value={block.ai?.endpoint || ""}
              onChange={(e) => setCfg("endpoint", e.target.value)}
              placeholder="Azure Endpoint (ex: https://x.openai.azure.com)"
              className="w-full rounded border p-1"
            />
          )}
          <textarea
            value={block.ai?.system || ""}
            onChange={(e) => setCfg("system", e.target.value)}
            rows={2}
            placeholder="System (opcional)"
            className="w-full rounded border p-1"
          />
          <textarea
            value={block.ai?.prompt || ""}
            onChange={(e) => setCfg("prompt", e.target.value)}
            rows={3}
            placeholder="Prompt — use {{variavel}}"
            className="w-full rounded border p-1"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={block.ai?.maxTokens || 512}
              onChange={(e) => setCfg("maxTokens", Number(e.target.value))}
              className="w-24 rounded border p-1"
              placeholder="max tokens"
            />
            <input
              value={block.ai?.variable || ""}
              onChange={(e) => setCfg("variable", e.target.value)}
              placeholder="var (salva resposta)"
              className="flex-1 rounded border p-1"
            />
          </div>
          <p className="text-xs text-gray-400">
            Contador de tokens exibido no chat. A API Key pode ser colada aqui no card
            (ou configurada em <b>Integrações → ai</b>).
          </p>
        </div>
      )}

      {(block.type === "whatsapp" || block.type === "telegram") && (
        <div className="space-y-2">
          <input
            value={(block[block.type] as any)?.to || ""}
            onChange={(e) => setCfg("to", e.target.value)}
            placeholder={block.type === "whatsapp" ? "número (ex: 5511999...)" : "chat_id"}
            className="w-full rounded border p-1"
          />
          <textarea
            value={(block[block.type] as any)?.message || ""}
            onChange={(e) => setCfg("message", e.target.value)}
            rows={3}
            placeholder="Mensagem — use {{variavel}}"
            className="w-full rounded border p-1"
          />
        </div>
      )}

      {block.type === "google_sheets" && (
        <div className="space-y-2">
          <input
            value={block.google_sheets?.spreadsheetId || ""}
            onChange={(e) => setCfg("spreadsheetId", e.target.value)}
            placeholder="Spreadsheet ID"
            className="w-full rounded border p-1"
          />
          <input
            value={block.google_sheets?.sheet || "Sheet1"}
            onChange={(e) => setCfg("sheet", e.target.value)}
            placeholder="Aba (ex: Sheet1)"
            className="w-full rounded border p-1"
          />
          <input
            value={block.google_sheets?.values || ""}
            onChange={(e) => setCfg("values", e.target.value)}
            placeholder="colunas: {{nome}},{{email}}"
            className="w-full rounded border p-1"
          />
          <p className="text-xs text-gray-400">
            Requer o JSON da conta de serviço em <b>Integrações → google</b> (sem .env).
          </p>
        </div>
      )}

      {block.type === "google_docs" && (
        <div className="space-y-2">
          <input
            value={block.google_docs?.documentId || ""}
            onChange={(e) => setCfg("documentId", e.target.value)}
            placeholder="Document ID"
            className="w-full rounded border p-1"
          />
          <textarea
            value={block.google_docs?.text || ""}
            onChange={(e) => setCfg("text", e.target.value)}
            rows={3}
            placeholder="Texto a anexar — use {{variavel}}"
            className="w-full rounded border p-1"
          />
        </div>
      )}

      {block.type === "http" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={block.http?.method || "POST"}
              onChange={(e) => setCfg("method", e.target.value)}
              className="w-28 rounded border p-1"
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              value={block.http?.url || ""}
              onChange={(e) => setCfg("url", e.target.value)}
              placeholder="URL"
              className="flex-1 rounded border p-1"
            />
          </div>
          <input
            value={block.http?.headers || "{}"}
            onChange={(e) => setCfg("headers", e.target.value)}
            placeholder='headers JSON: {"X-Api-Key":"..."}'
            className="w-full rounded border p-1"
          />
          <textarea
            value={block.http?.body || ""}
            onChange={(e) => setCfg("body", e.target.value)}
            rows={3}
            placeholder="body (JSON ou texto) — opcional"
            className="w-full rounded border p-1"
          />
          <details className="text-xs text-gray-400">
            <summary>Autenticação básica (opcional)</summary>
            <div className="mt-1 flex gap-2">
              <input
                value={block.http?.authUser || ""}
                onChange={(e) => setCfg("authUser", e.target.value)}
                placeholder="usuário"
                className="flex-1 rounded border p-1"
              />
              <input
                value={block.http?.authPass || ""}
                onChange={(e) => setCfg("authPass", e.target.value)}
                placeholder="senha"
                className="flex-1 rounded border p-1"
              />
            </div>
          </details>
        </div>
      )}

      {block.type === "memory" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={block.memory?.operation || "set"}
              onChange={(e) => setCfg("operation", e.target.value)}
              className="w-28 rounded border p-1"
            >
              <option value="set">set</option>
              <option value="get">get</option>
              <option value="list">list</option>
            </select>
            <select
              value={block.memory?.dbType || "sqlite"}
              onChange={(e) => setCfg("dbType", e.target.value)}
              className="w-28 rounded border p-1"
            >
              <option value="sqlite">sqlite</option>
              <option value="postgres">postgres</option>
              <option value="mysql">mysql</option>
            </select>
          </div>
          <input
            value={block.memory?.key || ""}
            onChange={(e) => setCfg("key", e.target.value)}
            placeholder="chave"
            className="w-full rounded border p-1"
          />
          <input
            value={block.memory?.value || ""}
            onChange={(e) => setCfg("value", e.target.value)}
            placeholder="valor (suporta {{variavel}})"
            className="w-full rounded border p-1"
          />
          {block.memory?.dbType !== "sqlite" && (
            <div className="space-y-1 rounded bg-amber-50 p-2 text-xs text-amber-700">
              Banco não-sqlite exige autenticação:
              <input
                value={block.memory?.connection || ""}
                onChange={(e) => setCfg("connection", e.target.value)}
                placeholder="connection string"
                className="w-full rounded border p-1"
              />
              <input
                value={block.memory?.user || ""}
                onChange={(e) => setCfg("user", e.target.value)}
                placeholder="usuário"
                className="w-full rounded border p-1"
              />
              <input
                value={block.memory?.password || ""}
                onChange={(e) => setCfg("password", e.target.value)}
                placeholder="senha"
                className="w-full rounded border p-1"
              />
            </div>
          )}
        </div>
      )}

      {block.type === "file" && (
        <div className="space-y-2">
          <select
            value={block.file?.operation || "export_json"}
            onChange={(e) => setCfg("operation", e.target.value)}
            className="w-full rounded border p-1"
          >
            <option value="export_json">Exportar bot (JSON)</option>
            <option value="export_csv">Exportar respostas (CSV)</option>
          </select>
          <p className="text-xs text-gray-400">
            Gera um link de download para o usuário no chat.
          </p>
        </div>
      )}

      {isBranch && (
        <div className="rounded bg-indigo-50 p-2">
          <div className="mb-1 text-xs font-semibold text-indigo-700">
            Branching (drag the orange handle → target block)
          </div>
          {(block.branches || []).map((br) => (
            <div key={br.id} className="mb-1 flex flex-wrap items-center gap-1 text-xs">
              <select
                value={br.operator || "equals"}
                onChange={(e) => setBranch(br.id, { operator: e.target.value as any })}
                className="rounded border p-0.5"
              >
                <option value="equals">=</option>
                <option value="notEquals">≠</option>
                <option value="contains">contains</option>
                <option value="greater">&gt;</option>
                <option value="less">&lt;</option>
              </select>
              <input
                value={br.value || ""}
                onChange={(e) => setBranch(br.id, { value: e.target.value })}
                placeholder="value"
                className="w-24 rounded border p-0.5"
              />
              <button
                onClick={() =>
                  onChange({ branches: block.branches?.filter((x) => x.id !== br.id) })
                }
                className="text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onChange({
                branches: [
                  ...(block.branches || []),
                  { id: nanoid(6), label: "Rule", operator: "equals", value: "", next: null },
                ],
              })
            }
            className="text-xs text-indigo-700"
          >
            + Add branch
          </button>
        </div>
      )}
    </div>
  );
}
