import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { firstBlock } from "@/lib/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const bot = await prisma.bot.findUnique({ where: { slug: params.slug } });
  if (!bot || !bot.published)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conversation = await prisma.conversation.create({
    data: { botId: bot.id },
  });

  const flow = JSON.parse(bot.flow) as any[];
  const first = firstBlock(flow);
  return NextResponse.json({
    conversationId: conversation.id,
    block: first ?? null,
  });
}
