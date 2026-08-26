const BASE = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export interface RuntimeBlock {
  id: string;
  type: string;
  next: string | null;
  branches?: Array<{
    id: string;
    label: string;
    variable?: string;
    operator?: string;
    value?: string;
    next: string | null;
  }>;
  content?: string;
  url?: string;
  alt?: string;
  label?: string;
  placeholder?: string;
  inputKind?: string;
  variable?: string;
  options?: Array<{ id: string; label: string; value: string }>;
  format?: string;
  ai?: Record<string, unknown>;
  whatsapp?: Record<string, unknown>;
  telegram?: Record<string, unknown>;
  google_sheets?: Record<string, unknown>;
  google_docs?: Record<string, unknown>;
  http?: Record<string, unknown>;
  payment?: Record<string, unknown>;
  memory?: Record<string, unknown>;
  file?: Record<string, unknown>;
}

export interface StartResponse {
  conversationId: string;
  block: RuntimeBlock | null;
}

export interface AnswerResponse {
  block: RuntimeBlock | null;
  completed: boolean;
}

export interface ActionResult {
  result?: string;
  tokens?: { prompt: number; completion: number; total: number };
  url?: string;
  variable?: string;
  value?: string;
  error?: string;
  status?: number;
}

export interface DispatchResult {
  results: Record<string, string>;
}

async function proxy<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Python backend ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const python = {
  getFlow: (slug: string) =>
    proxy<{ name: string; flow: unknown; theme: unknown }>(`/api/v1/runtime/${slug}`),

  startConversation: (slug: string) =>
    proxy<StartResponse>(`/api/v1/runtime/${slug}/start`, { method: "POST" }),

  submitAnswer: (
    slug: string,
    body: { conversationId: string; blockId: string; variable?: string; value?: string }
  ) => proxy<AnswerResponse>(`/api/v1/runtime/${slug}/answer`, { method: "POST", body: JSON.stringify(body) }),

  runAction: (
    slug: string,
    body: { conversationId?: string; block: RuntimeBlock; variables?: Record<string, string> }
  ) =>
    proxy<{ result: ActionResult }>(`/api/v1/runtime/${slug}/action`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listIntegrations: () => proxy<{ integrations: string[] }>(`/api/v1/tasks/integrations`),

  dispatch: (integrations: string[], event: Record<string, unknown>) =>
    proxy<DispatchResult>(`/api/v1/tasks/dispatch`, {
      method: "POST",
      body: JSON.stringify({ integrations, event }),
    }),

  // Credenciais salvas no banco (substituem .env)
  getIntegrations: () =>
    proxy<{
      integrations: Array<{ name: string; enabled: boolean; config: Record<string, string> }>;
      dispatch: string[];
    }>(`/api/v1/integrations`),

  saveIntegration: (name: string, config: Record<string, string>, enabled = true) =>
    proxy<{ name: string; enabled: boolean; config: Record<string, string> }>(
      `/api/v1/integrations/${encodeURIComponent(name)}`,
      { method: "PUT", body: JSON.stringify({ config, enabled }) }
    ),

  deleteIntegration: (name: string) =>
    proxy<{ deleted: string }>(`/api/v1/integrations/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),

  setDispatch: (integrations: string[]) =>
    proxy<{ integrations: string[] }>(`/api/v1/integrations/_dispatch`, {
      method: "PUT",
      body: JSON.stringify({ integrations }),
    }),

  health: () => proxy<{ status: string; service: string }>(`/health`),
};
