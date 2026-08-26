"use client";

import { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { Block, BlockType, Theme } from "@/lib/flow";
import ChatWidget from "@/components/ChatWidget";
import FlowCanvas from "./FlowCanvas";
import BlockInspector from "./BlockInspector";
import ThemeToggle from "@/components/ThemeToggle";

const PALETTE: { type: BlockType; label: string; icon: string }[] = [
  { type: "text", label: "Text", icon: "💬" },
  { type: "image", label: "Image", icon: "🖼️" },
  { type: "input", label: "Input", icon: "⌨️" },
  { type: "buttons", label: "Buttons", icon: "🔘" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "ai", label: "IA", icon: "🤖" },
  { type: "payment", label: "Pagamento", icon: "💰" },
  { type: "whatsapp", label: "WhatsApp", icon: "📱" },
  { type: "telegram", label: "Telegram", icon: "✈️" },
  { type: "google_sheets", label: "Sheets", icon: "📊" },
  { type: "google_docs", label: "Docs", icon: "📄" },
  { type: "http", label: "HTTP", icon: "🌐" },
  { type: "memory", label: "Memória", icon: "🧠" },
  { type: "file", label: "Arquivo", icon: "📁" },
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
    case "ai":
      return { ...base, ai: { provider: "openai", model: "gpt-4o-mini", prompt: "Responda de forma curta: {{name}}" } };
    case "payment":
      return { ...base, payment: { provider: "mercadopago", amount: 1000, currency: "BRL", description: "Pagamento" } };
    case "whatsapp":
      return { ...base, whatsapp: { to: "", message: "Olá {{name}}!" } };
    case "telegram":
      return { ...base, telegram: { to: "", message: "Olá {{name}}!" } };
    case "google_sheets":
      return { ...base, google_sheets: { spreadsheetId: "", sheet: "Sheet1", values: "{{name}},{{email}}" } };
    case "google_docs":
      return { ...base, google_docs: { documentId: "", text: "Novo lead: {{name}}" } };
    case "http":
      return { ...base, http: { method: "POST", url: "", headers: "{}", body: "" } };
    case "memory":
      return { ...base, memory: { operation: "set", key: "last_user", value: "{{name}}", dbType: "sqlite" } };
    case "file":
      return { ...base, file: { operation: "export_json" } };
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

  const exportFlow = () => {
    const payload = JSON.stringify(
      { name, slug, published, flow, theme },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "bot"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFlow = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (Array.isArray(data.flow)) {
        setName(data.name ?? name);
        setSlug(data.slug ?? slug);
        setFlow(data.flow);
        if (data.theme) setTheme(data.theme);
      }
    } catch (err) {
      alert("Arquivo inválido: " + String(err));
    } finally {
      e.target.value = "";
    }
  };

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
          <button className="btn-primary px-3 py-1 text-sm" onClick={() => setPreview(false)}>
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
        <a href="/integrations" className="text-sm text-indigo-600">Integrações</a>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input flex-1"
        />
        <span className="text-xs text-gray-400">{saved ? "Saved" : "Saving…"}</span>
        <button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => setPreview(true)}>
          Preview
        </button>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Live
        </label>
        <button className="btn-primary px-3 py-1 text-sm" onClick={exportFlow}>
          Exportar
        </button>
        <label className="btn-primary cursor-pointer px-3 py-1 text-sm">
          Importar
          <input type="file" accept="application/json" className="hidden" onChange={importFlow} />
        </label>
        <ThemeToggle />
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
                className="flex flex-col items-center rounded border p-2 text-xs hover:bg-accent-soft"
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
