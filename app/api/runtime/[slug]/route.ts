import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBlock, firstBlock } from "@/lib/engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const bot = await prisma.bot.findUnique({ where: { slug: params.slug } });
  if (!bot || !bot.published)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    name: bot.name,
    flow: JSON.parse(bot.flow),
    theme: JSON.parse(bot.theme),
  });
}
