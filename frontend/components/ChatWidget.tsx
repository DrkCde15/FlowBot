"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block, Theme, ACTION_TYPES } from "@/lib/flow";
import { firstBlock, getBlock, getNextBlock } from "@/lib/engine";
import { python } from "@/lib/python_client";

type Step = {
  block: Block;
  userValue?: string;
  isUser?: boolean;
  actionResult?: ActionResult | null;
};

type ActionResult = {
  result?: string;
  tokens?: { prompt: number; completion: number; total: number };
  url?: string;
  variable?: string;
  value?: string;
  error?: string;
  status?: number;
};

const needsInput = (b: Block) =>
  b.type === "input" || b.type === "buttons" || b.type === "date";

const isAction = (b: Block) => (ACTION_TYPES as string[]).includes(b.type);

export default function ChatWidget({
  flow,
  theme,
  slug,
  live = false,
}: {
  flow: Block[];
  theme: Theme;
  slug?: string;
  live?: boolean;
}) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [active, setActive] = useState<Block | null>(null);
  const [pendingAction, setPendingAction] = useState<Block | null>(null);
  const [input, setInput] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [finished, setFinished] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const style = useMemo(
    () =>
      ({
        "--fb-primary": theme.primaryColor,
        "--fb-bg": theme.background,
        "--fb-color": theme.fontColor,
        "--fb-font": theme.fontFamily,
        "--fb-radius": `${theme.radius}px`,
        background: theme.background,
        color: theme.fontColor,
        fontFamily: theme.fontFamily,
      }) as React.CSSProperties,
    [theme]
  );

  const persist = useCallback(
    async (block: Block, variable: string | undefined, value: string) => {
      if (!live || !slug || !conversationId) return;
      await fetch(`/api/runtime/${slug}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, blockId: block.id, variable, value }),
      });
    },
    [live, slug, conversationId]
  );

  const showBlock = useCallback(
    (block: Block | null) => {
      if (!block) {
        setActive(null);
        setPendingAction(null);
        setFinished(true);
        return;
      }
      if (needsInput(block)) {
        setActive(block);
        return;
      }
      if (isAction(block)) {
        setPendingAction(block);
        runActionBlock(block);
        return;
      }
      // message blocks: display then auto-advance
      setSteps((s) => [...s, { block }]);
      const nxt = getBlock(flow, block.next) ?? null;
      setTimeout(() => showBlock(nxt), 250);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flow]
  );

  const runActionBlock = useCallback(
    async (block: Block) => {
      let result: ActionResult | null = null;
      if (live && slug) {
        try {
          const res = await python.runAction(slug, {
            conversationId: conversationId ?? undefined,
            block: block as any,
            variables,
          });
          result = res.result;
        } catch (e) {
          result = { error: String(e) };
        }
      } else {
        result = { result: `🔧 Ação (${block.type}) — modo preview` };
      }

      if (result?.variable && result?.value != null) {
        setVariables((v) => ({ ...v, [result!.variable!]: String(result!.value) }));
      }
      setPendingAction(null);
      setSteps((s) => [...s, { block, actionResult: result }]);
      const nxt = getBlock(flow, block.next) ?? null;
      setTimeout(() => showBlock(nxt), 350);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, slug, flow, conversationId, variables, showBlock]
  );

  const start = useCallback(async () => {
    setSteps([]);
    setFinished(false);
    setVariables({});
    if (live && slug) {
      const res = await fetch(`/api/runtime/${slug}/start`, { method: "POST" });
      const data = await res.json();
      setConversationId(data.conversationId);
      showBlock(data.block);
    } else {
      showBlock(firstBlock(flow) ?? null);
    }
  }, [live, slug, flow, showBlock]);

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [steps, active, pendingAction]);

  const submit = useCallback(
    async (block: Block, value: string, variable?: string) => {
      if (!value.trim()) return;
      setSteps((s) => [...s, { block, userValue: value, isUser: true }]);
      setActive(null);
      setInput("");
      setDateValue("");
      if (variable) setVariables((v) => ({ ...v, [variable]: value }));
      await persist(block, variable, value);

      const next = getNextBlock(flow, block, value);
      setTimeout(() => showBlock(next), 200);
    },
    [flow, showBlock, persist]
  );

  return (
    <div style={style} className="fb-root flex h-full w-full flex-col">
      <div ref={scrollRef} className="fb-messages flex-1 space-y-3 overflow-y-auto p-4">
        {steps.map((s, i) => (
          <Bubble key={i} step={s} theme={theme} />
        ))}
        {pendingAction && (
          <div className="flex animate-fade-up justify-start">
            <div
              className="max-w-[85%] rounded-[var(--fb-radius)] px-3.5 py-3 text-sm"
              style={{ background: "#eef1f6", color: theme.fontColor }}
            >
              <span className="opacity-70">Executando {pendingAction.type}…</span>
            </div>
          </div>
        )}
        {active && (
          <ActiveBlock
            block={active}
            theme={theme}
            input={input}
            setInput={setInput}
            dateValue={dateValue}
            setDateValue={setDateValue}
            onSubmit={submit}
            loading={loading}
          />
        )}
        {finished && (
          <div className="flex animate-fade-up justify-center py-1">
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
              Conversation complete
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ step, theme }: { step: Step; theme: Theme }) {
  if (step.isUser) {
    return (
      <div className="flex animate-fade-up justify-end">
        <div
          className="max-w-[80%] rounded-[var(--fb-radius)] px-3.5 py-2.5 text-sm font-medium shadow-sm"
          style={{ background: theme.primaryColor, color: "#fff" }}
        >
          {step.userValue}
        </div>
      </div>
    );
  }

  const b = step.block;
  const res = step.actionResult;

  // bloco de ação com resultado
  if (res) {
    return (
      <div className="flex animate-fade-up justify-start">
        <div
          className="max-w-[85%] rounded-[var(--fb-radius)] px-3.5 py-3 text-sm"
          style={{ background: "#eef1f6", color: theme.fontColor }}
        >
          {res.error ? (
            <span className="text-red-600">⚠️ {res.error}</span>
          ) : (
            <>
              {res.result && (
                <div className="whitespace-pre-wrap">{res.result}</div>
              )}
              {res.url && b.type === "payment" && (
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block rounded-xl px-4 py-2 font-semibold text-white"
                  style={{ background: theme.primaryColor }}
                >
                  Pagar ↗
                </a>
              )}
              {res.url && b.type === "file" && (
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block rounded-xl px-4 py-2 font-semibold text-white"
                  style={{ background: theme.primaryColor }}
                >
                  Baixar arquivo ↓
                </a>
              )}
              {res.tokens && (
                <div className="mt-2 text-xs text-gray-500">
                  🪙 tokens: {res.tokens.total} (prompt {res.tokens.prompt} / completion{" "}
                  {res.tokens.completion})
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-up justify-start">
      <div
        className="max-w-[80%] rounded-[var(--fb-radius)] px-3.5 py-2.5 text-sm"
        style={{ background: "#eef1f6", color: theme.fontColor }}
      >
        {b.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.url} alt={b.alt ?? ""} className="max-w-full rounded-lg" />
        ) : (
          b.content
        )}
      </div>
    </div>
  );
}

function ActiveBlock({
  block,
  theme,
  input,
  setInput,
  dateValue,
  setDateValue,
  onSubmit,
  loading,
}: {
  block: Block;
  theme: Theme;
  input: string;
  setInput: (v: string) => void;
  dateValue: string;
  setDateValue: (v: string) => void;
  onSubmit: (b: Block, value: string, variable?: string) => void;
  loading: boolean;
}) {
  const primary = theme.primaryColor;
  return (
    <div className="flex animate-fade-up justify-start">
      <div
        className="max-w-[85%] rounded-[var(--fb-radius)] px-3.5 py-3 text-sm"
        style={{ background: "#eef1f6", color: theme.fontColor }}
      >
        {block.label && <div className="mb-2 font-semibold">{block.label}</div>}

        {block.type === "input" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(block, input, block.variable);
            }}
            className="flex gap-2"
          >
            <input
              type={block.inputKind === "email" ? "email" : block.inputKind === "number" ? "number" : "text"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={block.placeholder}
              className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
            />
            <button
              type="submit"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white transition hover:brightness-110 active:scale-95"
              style={{ background: primary }}
              aria-label="Send"
            >
              →
            </button>
          </form>
        )}

        {block.type === "date" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(block, dateValue, block.variable);
            }}
            className="flex gap-2"
          >
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
            />
            <button
              type="submit"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white transition hover:brightness-110 active:scale-95"
              style={{ background: primary }}
              aria-label="Send"
            >
              →
            </button>
          </form>
        )}

        {block.type === "buttons" && (
          <div className="flex flex-col gap-2">
            {block.options?.map((o) => (
              <button
                key={o.id}
                onClick={() => onSubmit(block, o.value, block.variable)}
                className="rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition duration-200 hover:bg-accent-soft active:scale-[0.98]"
                style={{ borderColor: primary, color: primary }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
