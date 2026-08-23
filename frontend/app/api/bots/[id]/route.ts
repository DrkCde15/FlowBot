import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bot = await prisma.bot.findUnique({ where: { id: params.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: bot.id,
    name: bot.name,
    slug: bot.slug,
    published: bot.published,
    flow: JSON.parse(bot.flow),
    theme: JSON.parse(bot.theme),
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.slug === "string") data.slug = body.slug;
  if (typeof body.published === "boolean") data.published = body.published;
  if (body.flow) data.flow = JSON.stringify(body.flow);
  if (body.theme) data.theme = JSON.stringify(body.theme);

  const bot = await prisma.bot.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, updatedAt: bot.updatedAt });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.bot.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
