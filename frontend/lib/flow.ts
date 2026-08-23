export type BlockType =
  | "text"
  | "image"
  | "input"
  | "buttons"
  | "date"
  | "stripe";

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

  // input / buttons / date / stripe
  label?: string;
  placeholder?: string;
  inputKind?: InputKind;
  variable?: string;

  // buttons
  options?: { id: string; label: string; value: string }[];

  // date
  format?: string;

  // stripe
  stripe?: {
    publishableKey?: string;
    priceId?: string;
    amount?: number; // in cents
    currency?: string;
    mode?: "payment" | "subscription";
  };
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
