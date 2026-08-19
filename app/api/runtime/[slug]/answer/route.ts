import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBlock, getNextBlock } from "@/lib/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await req.json();
  const { conversationId, blockId, variable, value } = body as {
    conversationId: string;
    blockId: string;
    variable?: string;
    value?: string;
  };

  const bot = await prisma.bot.findUnique({ where: { slug: params.slug } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const flow = JSON.parse(bot.flow) as any[];

  if (typeof value === "string" && value.length > 0) {
    await prisma.answer.create({
      data: {
        botId: bot.id,
        conversationId,
        blockId,
        variable: variable ?? null,
        value,
      },
    });
  }

  const current = getBlock(flow, blockId);
  if (!current)
    return NextResponse.json({ block: null, completed: true });

  const next = getNextBlock(flow, current, value);

  if (!next) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { isCompleted: true, completedAt: new Date() },
    });
    return NextResponse.json({ block: null, completed: true });
  }

  return NextResponse.json({ block: next, completed: false });
}
