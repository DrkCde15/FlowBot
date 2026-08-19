"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BotSummary = {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  updatedAt: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [bots, setBots] = useState<BotSummary[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/bots")
      .then((r) => r.json())
      .then((d) => setBots(d))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    const res = await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Untitled bot" }),
    });
    const d = await res.json();
    router.push(`/builder/${d.id}`);
  };

  const remove = async (id: string) => {
    await fetch(`/api/bots/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Your bots</h1>

      <div className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New bot name"
          className="flex-1 rounded border p-2"
        />
        <button onClick={create} className="rounded bg-indigo-600 px-4 py-2 text-white">
          Create bot
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading…</div>
      ) : bots.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-gray-400">
          No bots yet. Create your first one above.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bots.map((b) => (
            <div key={b.id} className="rounded border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{b.name}</div>
                {b.published && (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Live
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-400">/{b.slug}</div>
              <div className="mt-3 flex gap-2 text-sm">
                <a href={`/builder/${b.id}`} className="text-indigo-600">Edit</a>
                <a href={`/bots/${b.id}/analytics`} className="text-indigo-600">Analytics</a>
                {b.published && (
                  <a href={`/b/${b.slug}`} target="_blank" className="text-indigo-600">Open</a>
                )}
                <button onClick={() => remove(b.id)} className="ml-auto text-red-500">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
