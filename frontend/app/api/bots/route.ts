import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emptyFlow, defaultTheme } from "@/lib/flow";

export async function GET() {
  const bots = await prisma.bot.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, slug: true, published: true, updatedAt: true },
  });
  return NextResponse.json(bots);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name: string = body.name?.trim() || "Untitled bot";
  const slug =
    (body.slug as string) ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);

  const bot = await prisma.bot.create({
    data: {
      name,
      slug,
      flow: JSON.stringify(emptyFlow()),
      theme: JSON.stringify(defaultTheme),
    },
  });
  return NextResponse.json({ id: bot.id, slug: bot.slug });
}
