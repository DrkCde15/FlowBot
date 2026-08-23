"use client";

import { Block, Branch } from "@/lib/flow";
import { nanoid } from "nanoid";

export default function BlockInspector({
  block,
  onChange,
  onRemove,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
}) {
  const setBranch = (id: string, patch: Partial<Branch>) =>
    onChange({
      branches: (block.branches || []).map((b) =>
        b.id === id ? { ...b, ...patch } : b
      ),
    });

  const isBranch =
    block.type === "input" || block.type === "buttons" || block.type === "date";

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-gray-400">
          {block.type} block
        </span>
        <button onClick={onRemove} className="text-red-500">
          Delete
        </button>
      </div>

      {block.type === "text" && (
        <textarea
          value={block.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          className="w-full rounded border p-2"
          rows={3}
        />
      )}

      {block.type === "image" && (
        <input
          value={block.url || ""}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="Image URL"
          className="w-full rounded border p-1"
        />
      )}

      {(block.type === "input" ||
        block.type === "buttons" ||
        block.type === "date" ||
        block.type === "stripe") && (
        <input
          value={block.label || ""}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Question / label"
          className="w-full rounded border p-1"
        />
      )}

      {block.type === "input" && (
        <div className="flex gap-2">
          <input
            value={block.placeholder || ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Placeholder"
            className="flex-1 rounded border p-1"
          />
          <select
            value={block.inputKind || "text"}
            onChange={(e) => onChange({ inputKind: e.target.value as any })}
            className="rounded border p-1"
          >
            <option value="text">text</option>
            <option value="email">email</option>
            <option value="number">number</option>
            <option value="phone">phone</option>
          </select>
          <input
            value={block.variable || ""}
            onChange={(e) => onChange({ variable: e.target.value })}
            placeholder="var"
            className="w-20 rounded border p-1"
          />
        </div>
      )}

      {block.type === "buttons" && (
        <div className="space-y-1">
          {(block.options || []).map((o, i) => (
            <div key={o.id} className="flex gap-1">
              <input
                value={o.label}
                onChange={(e) => {
                  const opts = [...(block.options || [])];
                  opts[i] = { ...o, label: e.target.value };
                  onChange({ options: opts });
                }}
                className="flex-1 rounded border p-1"
              />
              <input
                value={o.value}
                onChange={(e) => {
                  const opts = [...(block.options || [])];
                  opts[i] = { ...o, value: e.target.value };
                  onChange({ options: opts });
                }}
                className="w-24 rounded border p-1"
              />
              <button
                onClick={() =>
                  onChange({ options: block.options?.filter((x) => x.id !== o.id) })
                }
                className="text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onChange({
                options: [
                  ...(block.options || []),
                  { id: nanoid(6), label: "Option", value: "value" },
                ],
              })
            }
            className="text-xs text-indigo-600"
          >
            + Add option
          </button>
        </div>
      )}

      {block.type === "stripe" && (
        <div className="flex gap-2">
          <input
            type="number"
            value={block.stripe?.amount || 0}
            onChange={(e) =>
              onChange({ stripe: { ...block.stripe, amount: Number(e.target.value) } })
            }
            className="w-28 rounded border p-1"
            placeholder="cents"
          />
          <input
            value={block.stripe?.currency || "usd"}
            onChange={(e) =>
              onChange({ stripe: { ...block.stripe, currency: e.target.value } })
            }
            className="w-20 rounded border p-1"
          />
        </div>
      )}

      {isBranch && (
        <div className="rounded bg-indigo-50 p-2">
          <div className="mb-1 text-xs font-semibold text-indigo-700">
            Branching (drag the orange handle → target block)
          </div>
          {(block.branches || []).map((br) => (
            <div key={br.id} className="mb-1 flex flex-wrap items-center gap-1 text-xs">
              <select
                value={br.operator || "equals"}
                onChange={(e) => setBranch(br.id, { operator: e.target.value as any })}
                className="rounded border p-0.5"
              >
                <option value="equals">=</option>
                <option value="notEquals">≠</option>
                <option value="contains">contains</option>
                <option value="greater">&gt;</option>
                <option value="less">&lt;</option>
              </select>
              <input
                value={br.value || ""}
                onChange={(e) => setBranch(br.id, { value: e.target.value })}
                placeholder="value"
                className="w-24 rounded border p-0.5"
              />
              <button
                onClick={() =>
                  onChange({ branches: block.branches?.filter((x) => x.id !== br.id) })
                }
                className="text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onChange({
                branches: [
                  ...(block.branches || []),
                  { id: nanoid(6), label: "Rule", operator: "equals", value: "", next: null },
                ],
              })
            }
            className="text-xs text-indigo-700"
          >
            + Add branch
          </button>
        </div>
      )}
    </div>
  );
}
