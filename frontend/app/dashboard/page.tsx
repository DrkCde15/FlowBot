"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

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
    <div className="app-shell">
      <main id="main" className="container-app py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-fg shadow-glow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H10l-4 4v-4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight">FlowBot</span>
          </div>
          <a
            href="https://github.com"
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            Docs
          </a>
          <ThemeToggle />
        </header>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Your bots</h1>
          <p className="mt-1 text-muted">
            Build a conversational flow and drop it anywhere with a single embed tag.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Name your next bot…"
            className="input"
          />
          <button onClick={create} className="btn-primary shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Create bot
          </button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-28 animate-pulse bg-surface-2" />
            ))}
          </div>
        ) : bots.length === 0 ? (
          <div className="card flex flex-col items-start gap-4 p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold">Create your first bot</h2>
              <p className="mt-1 max-w-md text-sm text-muted">
                Give it a name above and open the visual editor. Drag message, input and
                button blocks, wire up branches, then publish and embed.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bots.map((b) => (
              <div key={b.id} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{b.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted">/{b.slug}</div>
                  </div>
                  {b.published && (
                    <span className="badge-live">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  )}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <a href={`/builder/${b.id}`} className="link">
                    Edit
                  </a>
                  <a href={`/bots/${b.id}/analytics`} className="link">
                    Analytics
                  </a>
                  {b.published && (
                    <a href={`/b/${b.slug}`} target="_blank" className="link">
                      Open
                    </a>
                  )}
                  <button onClick={() => remove(b.id)} className="btn-danger ml-auto px-2 py-1">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
