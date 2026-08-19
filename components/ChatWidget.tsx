"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block, Theme } from "@/lib/flow";
import { firstBlock, getBlock, getNextBlock } from "@/lib/engine";

type Step = {
  block: Block;
  userValue?: string;
  isUser?: boolean;
};

const needsInput = (b: Block) =>
  b.type === "input" ||
  b.type === "buttons" ||
  b.type === "date" ||
  b.type === "stripe";

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
  const [input, setInput] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [finished, setFinished] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
        setFinished(true);
        return;
      }
      if (needsInput(block)) {
        setActive(block);
        return;
      }
      // message blocks: display then auto-advance
      setSteps((s) => [...s, { block }]);
      const nxt = getBlock(flow, block.next) ?? null;
      // small delay for a natural feel
      setTimeout(() => showBlock(nxt), 250);
    },
    [flow]
  );

  const start = useCallback(async () => {
    setSteps([]);
    setFinished(false);
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
  }, [steps, active]);

  const submit = useCallback(
    async (block: Block, value: string, variable?: string) => {
      if (!value.trim()) return;
      setSteps((s) => [...s, { block, userValue: value, isUser: true }]);
      setActive(null);
      setInput("");
      setDateValue("");
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
        {active && <ActiveBlock block={active} theme={theme} input={input} setInput={setInput} dateValue={dateValue} setDateValue={setDateValue} onSubmit={submit} loading={loading} />}
        {finished && (
          <div className="text-center text-sm opacity-60">🎉 That's all — thanks!</div>
        )}
      </div>
    </div>
  );
}

function Bubble({ step, theme }: { step: Step; theme: Theme }) {
  if (step.isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-[var(--fb-radius)] px-3 py-2 text-sm"
          style={{ background: theme.primaryColor, color: "#fff" }}
        >
          {step.userValue}
        </div>
      </div>
    );
  }
  const b = step.block;
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[80%] rounded-[var(--fb-radius)] px-3 py-2 text-sm"
        style={{ background: "#f1f5f9", color: theme.fontColor }}
      >
        {b.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.url} alt={b.alt ?? ""} className="max-w-full rounded" />
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
    <div className="flex justify-start">
      <div
        className="max-w-[85%] rounded-[var(--fb-radius)] px-3 py-3 text-sm"
        style={{ background: "#f1f5f9", color: theme.fontColor }}
      >
        {block.label && <div className="mb-2 font-medium">{block.label}</div>}

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
              className="flex-1 rounded border px-2 py-1 outline-none"
              style={{ borderColor: "#cbd5e1" }}
            />
            <button
              type="submit"
              className="rounded px-3 py-1 text-white"
              style={{ background: primary }}
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
              className="rounded border px-2 py-1"
              style={{ borderColor: "#cbd5e1" }}
            />
            <button type="submit" className="rounded px-3 py-1 text-white" style={{ background: primary }}>
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
                className="rounded border px-3 py-2 text-left text-sm font-medium"
                style={{ borderColor: primary, color: primary }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {block.type === "stripe" && (
          <button
            onClick={() => onSubmit(block, "paid", block.variable)}
            className="rounded px-3 py-2 text-white"
            style={{ background: primary }}
          >
            Pay {block.stripe?.amount ? `$${(block.stripe.amount / 100).toFixed(2)}` : ""} ↗
          </button>
        )}
      </div>
    </div>
  );
}
