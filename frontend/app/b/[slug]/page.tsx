"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatWidget from "@/components/ChatWidget";
import { Block, Theme, defaultTheme } from "@/lib/flow";

export default function BotPage() {
  const params = useParams();
  const slug = String(params.slug);
  const [flow, setFlow] = useState<Block[] | null>(null);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/runtime/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setFlow(d.flow);
        setTheme(d.theme);
      })
      .catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="p-6 text-center text-gray-500">Bot not found.</div>;
  if (!flow) return <div className="p-6 text-center text-gray-400">Loading…</div>;

  return (
    <div className="h-screen w-screen">
      <ChatWidget flow={flow} theme={theme} slug={slug} live />
    </div>
  );
}
