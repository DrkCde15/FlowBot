"use client";

import { Handle, Position } from "@xyflow/react";
import { Block } from "@/lib/flow";

const ICONS: Record<string, string> = {
  text: "💬",
  image: "🖼️",
  input: "⌨️",
  buttons: "🔘",
  date: "📅",
  stripe: "💳",
};

export default function BlockNode({
  data,
  selected,
}: {
  data: { block: Block };
  selected?: boolean;
}) {
  const b = data.block;
  const isBranch = b.type === "input" || b.type === "buttons" || b.type === "date";
  const preview =
    b.type === "text"
      ? b.content || "Mensagem…"
      : b.type === "image"
      ? b.url || "imagem"
      : b.label || b.type;

  return (
    <div
      className={`w-56 rounded-lg border bg-white shadow-sm text-sm ${
        selected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-200"
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="rounded-t-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 flex items-center gap-1">
        <span>{ICONS[b.type]}</span>
        <span className="capitalize">{b.type}</span>
      </div>
      <div className="px-3 py-2 text-gray-700 line-clamp-3 min-h-[2rem]">
        {preview}
      </div>

      {/* default next connection */}
      <Handle id="next" type="source" position={Position.Right} />

      {/* branch connections */}
      {isBranch &&
        (b.branches || []).map((br, i) => (
          <Handle
            key={br.id}
            id={br.id}
            type="source"
            position={Position.Right}
            style={{ top: `${44 + (i + 1) * 22}px`, background: "#f59e0b" }}
          />
        ))}
    </div>
  );
}
