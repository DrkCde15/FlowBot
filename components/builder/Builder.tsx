"use client";

import { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { Block, BlockType, Theme } from "@/lib/flow";
import ChatWidget from "@/components/ChatWidget";
import FlowCanvas from "./FlowCanvas";
import BlockInspector from "./BlockInspector";

const PALETTE: { type: BlockType; label: string; icon: string }[] = [
  { type: "text", label: "Text", icon: "💬" },
  { type: "image", label: "Image", icon: "🖼️" },
  { type: "input", label: "Input", icon: "⌨️" },
  { type: "buttons", label: "Buttons", icon: "🔘" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "stripe", label: "Stripe", icon: "💳" },
];

function newBlock(type: BlockType, index: number): Block {
  const id = nanoid(8);
  const base: Block = { id, type, next: null, x: 80 + (index % 3) * 280, y: 80 + Math.floor(index / 3) * 180 };
  switch (type) {
    case "text":
      return { ...base, content: "Your message here…" };
    case "image":
      return { ...base, url: "https://placehold.co/400x200", alt: "" };
    case "input":
      return {
        ...base,
        label: "What's your name?",
        placeholder: "Type here…",
        inputKind: "text",
        variable: "name",
      };
    case "buttons":
      return {
        ...base,
        label: "Choose an option",
        variable: "choice",
        options: [
          { id: nanoid(6), label: "Yes", value: "yes" },
          { id: nanoid(6), label: "No", value: "no" },
        ],
      };
    case "date":
      return { ...base, label: "Pick a date", variable: "date" };
    case "stripe":
      return {
        ...base,
        label: "Complete your payment",
        variable: "payment",
        stripe: { amount: 1000, currency: "usd", mode: "payment" },
      };
  }
}

export default function Builder({
  initial,
}: {
  initial: {
    id: string;
    name: string;
    slug: string;
    published: boolean;
    flow: Block[];
    theme: Theme;
  };
}) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [published, setPublished] = useState(initial.published);
  const [flow, setFlow] = useState<Block[]>(initial.flow);
  const [theme, setTheme] = useState<Theme>(initial.theme);
  const [tab, setTab] = useState<"edit" | "theme" | "embed">("edit");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [preview, setPreview] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch(`/api/bots/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, published, flow, theme }),
      });
      setSaved(true);
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [name, slug, published, flow, theme, initial.id]);

  const selected = flow.find((b) => b.id === selectedId) || null;

  const addBlock = (type: BlockType) =>
    setFlow((f) => {
      const block = newBlock(type, f.length);
      const copy = [...f];
      const last = copy[copy.length - 1];
      if (last) last.next = block.id;
      return [...copy, block];
    });

  const updateBlock = (id: string, patch: Partial<Block>) =>
    setFlow((f) => f.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const removeBlock = (id: string) =>
    setFlow((f) =>
      f
        .filter((b) => b.id !== id)
        .map((b) => ({
          ...b,
          next: b.next === id ? null : b.next,
          branches: (b.branches || []).map((br) =>
            br.next === id ? { ...br, next: null } : br
          ),
        }))
    );

  if (preview) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center gap-2 border-b bg-white px-4 py-2">
          <button className="rounded bg-gray-900 px-3 py-1 text-sm text-white" onClick={() => setPreview(false)}>
            ← Back to editor
          </button>
          <span className="text-sm text-gray-500">Preview (not saved to server)</span>
        </div>
        <div className="mx-auto h-full w-full max-w-md border-x bg-white">
          <ChatWidget flow={flow} theme={theme} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center gap-3 border-b bg-white px-4 py-2">
        <a href="/dashboard" className="text-sm text-indigo-600">← Bots</a>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border px-2 py-1 text-sm font-semibold"
        />
        <span className="text-xs text-gray-400">{saved ? "Saved" : "Saving…"}</span>
        <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => setPreview(true)}>
          Preview
        </button>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Live
        </label>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* palette */}
        <aside className="w-44 border-r bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase text-gray-400">Add block</div>
          <div className="grid grid-cols-2 gap-2">
            {PALETTE.map((p) => (
              <button
                key={p.type}
                onClick={() => addBlock(p.type)}
                className="flex flex-col items-center rounded border p-2 text-xs hover:bg-indigo-50"
              >
                <span className="text-lg">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Drag from a node's right handle to another node to connect. Drag the
            orange handle (on input/buttons/date) for branching.
          </div>
        </aside>

        {/* canvas */}
        <main className="relative flex-1">
          <FlowCanvas
            flow={flow}
            setFlow={setFlow}
            onSelect={setSelectedId}
          />
        </main>

        {/* right panel */}
        <aside className="w-80 overflow-y-auto border-l bg-white p-4">
          <div className="mb-3 flex gap-1 text-sm">
            {(["edit", "theme", "embed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded px-2 py-1 capitalize ${tab === t ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "theme" && <ThemePanel theme={theme} onChange={setTheme} />}
          {tab === "embed" && <EmbedPanel slug={slug} published={published} theme={theme} />}
          {tab === "edit" &&
            (selected ? (
              <BlockInspector
                block={selected}
                onChange={(patch) => updateBlock(selected.id, patch)}
                onRemove={() => {
                  removeBlock(selected.id);
                  setSelectedId(null);
                }}
              />
            ) : (
              <div className="text-sm text-gray-500">
                Select a block on the canvas to edit it, or add blocks from the left.
              </div>
            ))}
        </aside>
      </div>
    </div>
  );
}

function ThemePanel({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (t: Theme) => void;
}) {
  const set = (patch: Partial<Theme>) => onChange({ ...theme, ...patch });
  return (
    <div className="space-y-3 text-sm">
      <ColorField label="Primary color" value={theme.primaryColor} onChange={(v) => set({ primaryColor: v })} />
      <ColorField label="Background" value={theme.background} onChange={(v) => set({ background: v })} />
      <ColorField label="Font color" value={theme.fontColor} onChange={(v) => set({ fontColor: v })} />
      <ColorField label="Bubble color" value={theme.bubbleColor} onChange={(v) => set({ bubbleColor: v })} />
      <label className="block">
        Font family
        <input
          value={theme.fontFamily}
          onChange={(e) => set({ fontFamily: e.target.value })}
          className="mt-1 w-full rounded border p-1"
        />
      </label>
      <label className="block">
        Corner radius: {theme.radius}px
        <input
          type="range"
          min={0}
          max={28}
          value={theme.radius}
          onChange={(e) => set({ radius: Number(e.target.value) })}
          className="w-full"
        />
      </label>
      <label className="block">
        Embed type
        <select
          value={theme.embedType}
          onChange={(e) => set({ embedType: e.target.value as any })}
          className="mt-1 w-full rounded border p-1"
        >
          <option value="bubble">Bubble</option>
          <option value="popup">Popup</option>
        </select>
      </label>
      <label className="block">
        Position
        <select
          value={theme.position}
          onChange={(e) => set({ position: e.target.value as any })}
          className="mt-1 w-full rounded border p-1"
        >
          <option value="right">Right</option>
          <option value="left">Left</option>
        </select>
      </label>
      <label className="block">
        Bubble text
        <input
          value={theme.bubbleText}
          onChange={(e) => set({ bubbleText: e.target.value })}
          className="mt-1 w-full rounded border p-1"
        />
      </label>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function EmbedPanel({
  slug,
  published,
  theme,
}: {
  slug: string;
  published: boolean;
  theme: Theme;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const snippet = `<script src="${origin}/embed.js" data-slug="${slug}" data-type="${theme.embedType}" data-position="${theme.position}" data-bubble-text="${theme.bubbleText}"></script>`;
  if (!published)
    return <div className="text-sm text-amber-600">Publish the bot (toggle “Live”) before embedding.</div>;
  return (
    <div className="space-y-2 text-sm">
      <div className="font-semibold">Embed code</div>
      <pre className="overflow-x-auto rounded bg-gray-900 p-2 text-xs text-green-300">{snippet}</pre>
      <div className="font-semibold">Direct link</div>
      <a className="text-indigo-600" href={`/b/${slug}`} target="_blank">
        {origin}/b/{slug}
      </a>
    </div>
  );
}
