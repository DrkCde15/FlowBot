"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

interface Integration {
  name: string;
  enabled: boolean;
  config: Record<string, string>;
}
interface ListResponse {
  integrations: Integration[];
  dispatch: string[];
}

const FIELDS: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  telegram: [
    { key: "bot_token", label: "Bot Token", secret: true },
    { key: "chat_id", label: "Chat ID" },
  ],
  whatsapp: [
    { key: "account_sid", label: "Twilio Account SID", secret: true },
    { key: "auth_token", label: "Twilio Auth Token", secret: true },
    { key: "from_number", label: "From Number (ex: +5511...)" },
  ],
  slack: [
    { key: "webhook_url", label: "Webhook URL" },
    { key: "bot_token", label: "Bot Token", secret: true },
    { key: "channel", label: "Channel (ex: #general)" },
  ],
  discord: [{ key: "webhook_url", label: "Webhook URL" }],
  email: [
    { key: "smtp_host", label: "SMTP Host" },
    { key: "smtp_port", label: "SMTP Port" },
    { key: "smtp_user", label: "SMTP User", secret: true },
    { key: "smtp_password", label: "SMTP Password", secret: true },
    { key: "smtp_from", label: "From (email)" },
    { key: "smtp_use_tls", label: "Use TLS (true/false)" },
    { key: "sendgrid_api_key", label: "SendGrid API Key", secret: true },
  ],
  webhook: [
    { key: "default_url", label: "Default URL" },
    { key: "default_secret", label: "Default Secret", secret: true },
  ],
  n8n: [
    { key: "webhook_url", label: "Webhook URL" },
    { key: "webhook_secret", label: "Webhook Secret", secret: true },
  ],
  crm: [
    { key: "webhook_url", label: "Webhook URL" },
    { key: "webhook_secret", label: "Webhook Secret", secret: true },
  ],
  ai: [
    { key: "default_provider", label: "Default Provider (openai/anthropic/google/...)" },
    { key: "default_model", label: "Default Model (ex: gpt-4o-mini)" },
    { key: "openai_api_key", label: "OpenAI API Key", secret: true },
    { key: "anthropic_api_key", label: "Anthropic API Key", secret: true },
    { key: "google_ai_api_key", label: "Google AI API Key", secret: true },
    { key: "deepseek_api_key", label: "DeepSeek API Key", secret: true },
    { key: "groq_api_key", label: "Groq API Key", secret: true },
    { key: "mistral_api_key", label: "Mistral API Key", secret: true },
    { key: "openrouter_api_key", label: "OpenRouter API Key", secret: true },
    { key: "together_api_key", label: "Together API Key", secret: true },
    { key: "perplexity_api_key", label: "Perplexity API Key", secret: true },
    { key: "xai_api_key", label: "xAI API Key", secret: true },
    { key: "ollama_base_url", label: "Ollama Base URL (ex: http://localhost:11434/v1)" },
    { key: "azure_api_key", label: "Azure OpenAI Key", secret: true },
    { key: "azure_endpoint", label: "Azure Endpoint (ex: https://x.openai.azure.com)" },
    { key: "custom_base_url", label: "Custom Base URL (OpenAI-compatible)" },
    { key: "custom_api_key", label: "Custom API Key", secret: true },
  ],
  payment: [
    { key: "provider", label: "Default Provider (mercadopago/pagseguro/pagarme/asaas/paypal/link)" },
    { key: "currency", label: "Default Currency (ex: BRL)" },
    { key: "webhook_secret", label: "Webhook Secret", secret: true },
    { key: "mercadopago_access_token", label: "Mercado Pago Access Token", secret: true },
    { key: "pagseguro_token", label: "PagSeguro Token", secret: true },
    { key: "pagseguro_base_url", label: "PagSeguro Base URL (opcional)" },
    { key: "pagarme_api_key", label: "Pagar.me API Key", secret: true },
    { key: "pagarme_base_url", label: "Pagar.me Base URL (opcional)" },
    { key: "asaas_api_key", label: "Asaas API Key", secret: true },
    { key: "asaas_base_url", label: "Asaas Base URL (opcional)" },
    { key: "paypal_client_id", label: "PayPal Client ID", secret: true },
    { key: "paypal_secret", label: "PayPal Secret", secret: true },
  ],
  google: [{ key: "credentials_json", label: "Service Account JSON", secret: true }],
  memory: [{ key: "db_path", label: "SQLite DB path (opcional)" }],
};

export default function IntegrationsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [editing, setEditing] = useState<Record<string, Record<string, string>>>({});
  const [dispatchSel, setDispatchSel] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await fetch("/api/integrations");
    setData(await res.json());
    if (res.ok) setDispatchSel((await res.json()).dispatch);
  };
  useEffect(() => {
    load();
  }, []);

  function openEditor(it: Integration) {
    const current: Record<string, string> = {};
    for (const f of FIELDS[it.name] || []) {
      const v = it.config[f.key];
      current[f.key] = v && v !== "••••••" ? v : "";
    }
    setEditing({ ...editing, [it.name]: current });
  }

  async function save(name: string) {
    const cfg = editing[name] || {};
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(cfg)) {
      if (v && v.trim() !== "") payload[k] = v;
    }
    const res = await fetch(`/api/integrations?name=${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ config: payload }),
    });
    if (res.ok) {
      setEditing({ ...editing, [name]: {} });
      setMsg(`Integração "${name}" salva`);
      load();
    } else {
      setMsg(`Erro: ${(await res.json()).error}`);
    }
  }

  async function remove(name: string) {
    await fetch(`/api/integrations?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    load();
  }

  async function saveDispatch() {
    const res = await fetch(`/api/integrations?dispatch=1`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ integrations: dispatchSel }),
    });
    if (res.ok) setMsg("Dispatch automático atualizado");
  }

  const notify = ["telegram", "whatsapp", "slack", "discord", "email", "webhook", "n8n", "crm"];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Integrações</h1>
        <ThemeToggle />
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Credenciais salvas no banco de dados (não mais em .env). Segredos são mascarados.
      </p>
      {msg && <div className="mb-4 rounded bg-green-50 p-2 text-sm text-green-700">{msg}</div>}

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Dispatch automático</h2>
        <p className="mb-2 text-xs text-gray-400">
          Integrações notificadas a cada resposta coletada no chat.
        </p>
        <div className="flex flex-wrap gap-3">
          {notify.map((n) => (
            <label key={n} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={dispatchSel.includes(n)}
                onChange={(e) =>
                  setDispatchSel((s) =>
                    e.target.checked ? [...s, n] : s.filter((x) => x !== n)
                  )
                }
              />
              {n}
            </label>
          ))}
        </div>
        <button
          className="mt-3 rounded bg-indigo-600 px-3 py-1 text-sm text-white"
          onClick={saveDispatch}
        >
          Salvar dispatch
        </button>
      </section>

      <section className="space-y-4">
        {data?.integrations.map((it) => (
          <div key={it.name} className="rounded border bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{it.name}</h3>
              <div className="flex gap-2">
                {!editing[it.name] && (
                  <button
                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                    onClick={() => openEditor(it)}
                  >
                    Editar
                  </button>
                )}
                <button
                  className="rounded bg-red-50 px-2 py-1 text-xs text-red-600"
                  onClick={() => remove(it.name)}
                >
                  Remover
                </button>
              </div>
            </div>
            {editing[it.name] ? (
              <div className="space-y-2">
                {(FIELDS[it.name] || []).map((f) => (
                  <input
                    key={f.key}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder={f.label}
                    type={f.secret ? "password" : "text"}
                    value={editing[it.name][f.key] || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [it.name]: { ...editing[it.name], [f.key]: e.target.value },
                      })
                    }
                  />
                ))}
                <div className="flex gap-2">
                  <button
                    className="rounded bg-green-600 px-3 py-1 text-xs text-white"
                    onClick={() => save(it.name)}
                  >
                    Salvar
                  </button>
                  <button
                    className="rounded bg-gray-100 px-3 py-1 text-xs"
                    onClick={() => setEditing({ ...editing, [it.name]: {} })}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                {Object.entries(it.config).length
                  ? Object.entries(it.config)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")
                  : "não configurado"}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
