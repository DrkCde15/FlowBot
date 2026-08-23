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
  stripe?: Record<string, unknown>;
}

export interface StartResponse {
  conversationId: string;
  block: RuntimeBlock | null;
}

export interface AnswerResponse {
  block: RuntimeBlock | null;
  completed: boolean;
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

  listIntegrations: () => proxy<{ integrations: string[] }>(`/api/v1/tasks/integrations`),

  dispatch: (integrations: string[], event: Record<string, unknown>) =>
    proxy<DispatchResult>(`/api/v1/tasks/dispatch`, {
      method: "POST",
      body: JSON.stringify({ integrations, event }),
    }),

  health: () => proxy<{ status: string; service: string }>(`/health`),
};
