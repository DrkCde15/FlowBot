import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bot = await prisma.bot.findUnique({
    where: { id: params.id },
    include: {
      conversations: {
        include: { answers: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const variableSet = new Set<string>();
  for (const c of bot.conversations) {
    for (const a of c.answers) {
      if (a.variable) variableSet.add(a.variable);
    }
  }
  const variables = Array.from(variableSet);

  const header = [
    "conversation_id",
    "started_at",
    "completed_at",
    "completed",
    ...variables,
  ];

  const rows = bot.conversations.map((c) => {
    const byVar: Record<string, string> = {};
    for (const a of c.answers) {
      if (a.variable) byVar[a.variable] = a.value;
    }
    return [
      c.id,
      c.createdAt.toISOString(),
      c.completedAt?.toISOString() ?? "",
      c.isCompleted ? "yes" : "no",
      ...variables.map((v) => byVar[v] ?? ""),
    ];
  });

  const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bot.slug}-export.csv"`,
    },
  });
}
