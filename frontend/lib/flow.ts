export type BlockType =
  | "text"
  | "image"
  | "input"
  | "buttons"
  | "date"
  // ações / integrações
  | "ai"
  | "whatsapp"
  | "telegram"
  | "google_sheets"
  | "google_docs"
  | "http"
  | "payment"
  | "memory"
  | "file";

export type InputKind = "text" | "email" | "number" | "phone";

export interface Branch {
  id: string;
  /** Human label shown in the editor */
  label: string;
  /** Variable name to test (e.g. the block's variable) */
  variable?: string;
  /** Comparison operator */
  operator?: "equals" | "contains" | "notEquals" | "greater" | "less";
  /** Value to compare against */
  value?: string;
  /** Target block id when the condition matches */
  next: string | null;
}

// --- Configurações das ações / integrações ---

export interface AIConfig {
  provider?: string; // openai | anthropic | google | deepseek | groq | mistral | openrouter | together | perplexity | xai | ollama | azure | custom
  model?: string;
  system?: string;
  prompt?: string;
  variable?: string;
  maxTokens?: number;
  apiKey?: string; // opcional: chave por card (senão usa a da integração "ai")
  baseUrl?: string; // opcional: base URL por card (provedores custom/ollama)
  endpoint?: string; // opcional: endpoint do Azure por card
}

export interface MessagingConfig {
  to?: string;
  message?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  sheet?: string;
  values?: string; // colunas separadas por vírgula, suporta {{variavel}}
}

export interface GoogleDocsConfig {
  documentId?: string;
  text?: string;
}

export interface HTTPConfig {
  method?: string;
  url?: string;
  headers?: string; // JSON opcional
  body?: string;
  authUser?: string;
  authPass?: string;
}

export interface PaymentConfig {
  provider?: string; // mercadopago | pagseguro | pagarme | asaas | paypal | link
  amount?: number; // em centavos
  currency?: string;
  description?: string;
  variable?: string;
  url?: string; // usado no modo "link"
}

export interface MemoryConfig {
  operation?: "set" | "get" | "list";
  key?: string;
  value?: string;
  dbType?: "sqlite" | "postgres" | "mysql";
  connection?: string;
  user?: string;
  password?: string;
}

export interface FileConfig {
  operation?: "export_json" | "export_csv";
}

export interface Block {
  id: string;
  type: BlockType;
  /** Canvas position (n8n-style editor) */
  x?: number;
  y?: number;
  /** Default next block id (linear flow graph) */
  next: string | null;
  /** Branching logic (used by buttons / inputs) */
  branches?: Branch[];

  // text
  content?: string;

  // image
  url?: string;
  alt?: string;

  // input / buttons / date
  label?: string;
  placeholder?: string;
  inputKind?: InputKind;
  variable?: string;

  // buttons
  options?: { id: string; label: string; value: string }[];

  // date
  format?: string;

  // ações / integrações
  ai?: AIConfig;
  whatsapp?: MessagingConfig;
  telegram?: MessagingConfig;
  google_sheets?: GoogleSheetsConfig;
  google_docs?: GoogleDocsConfig;
  http?: HTTPConfig;
  payment?: PaymentConfig;
  memory?: MemoryConfig;
  file?: FileConfig;
}

export interface Theme {
  primaryColor: string;
  background: string;
  fontColor: string;
  fontFamily: string;
  bubbleColor: string;
  radius: number;
  position: "left" | "right";
  embedType: "bubble" | "popup";
  bubbleText: string;
}

export const defaultTheme: Theme = {
  primaryColor: "#4f46e5",
  background: "#ffffff",
  fontColor: "#1f2937",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  bubbleColor: "#4f46e5",
  radius: 12,
  position: "right",
  embedType: "bubble",
  bubbleText: "Chat with us",
};

/** Tipos de bloco que disparam uma ação no backend (sem input do usuário). */
export const ACTION_TYPES: BlockType[] = [
  "ai",
  "whatsapp",
  "telegram",
  "google_sheets",
  "google_docs",
  "http",
  "payment",
  "memory",
  "file",
];

export function emptyFlow(): Block[] {
  return [
    {
      id: "start",
      type: "text",
      next: null,
      content: "Hi! 👋 Welcome. This is the first message of your bot.",
    },
  ];
}
