import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bot = await prisma.bot.findUnique({
    where: { id: params.id },
    include: { conversations: { include: { answers: true } } },
  });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const total = bot.conversations.length;
  const completed = bot.conversations.filter((c) => c.isCompleted).length;
  const answers = bot.conversations.flatMap((c) => c.answers);

  const byVariable: Record<string, { count: number; samples: string[] }> = {};
  for (const a of answers) {
    const key = a.variable || "(no variable)";
    if (!byVariable[key])
      byVariable[key] = { count: 0, samples: [] };
    byVariable[key].count += 1;
    if (byVariable[key].samples.length < 5 && a.value)
      byVariable[key].samples.push(a.value);
  }

  // last 14 days activity
  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    const count = bot.conversations.filter(
      (c) => c.createdAt >= start && c.createdAt <= end
    ).length;
    days.push({ date: start.toISOString().slice(0, 10), count });
  }

  return NextResponse.json({
    total,
    completed,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    totalAnswers: answers.length,
    byVariable,
    activity: days,
    recent: bot.conversations
      .slice(0, 20)
      .map((c) => ({
        id: c.id,
        startedAt: c.createdAt,
        completed: c.isCompleted,
        answers: c.answers.map((a) => ({ variable: a.variable, value: a.value })),
      })),
  });
}
