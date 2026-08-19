"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AnalyticsPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/bots/${id}/analytics`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) return <div className="p-8 text-gray-400">Loading…</div>;

  const max = Math.max(1, ...data.activity.map((d: any) => d.count));

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <a
          href={`/api/bots/${id}/export`}
          className="rounded bg-indigo-600 px-3 py-1 text-sm text-white"
        >
          Export CSV
        </a>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Conversations" value={data.total} />
        <Stat label="Completed" value={data.completed} />
        <Stat label="Completion rate" value={`${data.completionRate}%`} />
      </div>

      <div className="mb-6 rounded border bg-white p-4">
        <div className="mb-2 text-sm font-semibold">Last 14 days</div>
        <div className="flex items-end gap-1" style={{ height: 100 }}>
          {data.activity.map((d: any) => (
            <div key={d.date} className="flex flex-1 flex-col items-center">
              <div
                className="w-full rounded bg-indigo-400"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }}
                title={`${d.date}: ${d.count}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded border bg-white p-4">
        <div className="mb-2 text-sm font-semibold">Answers collected</div>
        <div className="space-y-2">
          {Object.entries(data.byVariable).map(([k, v]: any) => (
            <div key={k} className="text-sm">
              <span className="font-medium">{k}</span>: {v.count} responses
            </div>
          ))}
          {Object.keys(data.byVariable).length === 0 && (
            <div className="text-gray-400">No answers yet.</div>
          )}
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="mb-2 text-sm font-semibold">Recent conversations</div>
        <div className="space-y-2">
          {data.recent.map((c: any) => (
            <div key={c.id} className="rounded bg-gray-50 p-2 text-xs">
              <div className="text-gray-400">
                {new Date(c.startedAt).toLocaleString()} · {c.completed ? "completed" : "open"}
              </div>
              <div className="mt-1">
                {c.answers.map((a: any, i: number) => (
                  <span key={i} className="mr-2">
                    <b>{a.variable || "?"}</b>: {a.value}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {data.recent.length === 0 && (
            <div className="text-gray-400">No conversations yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border bg-white p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase text-gray-400">{label}</div>
    </div>
  );
}
