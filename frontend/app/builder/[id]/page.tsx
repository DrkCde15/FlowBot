import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Builder from "@/components/builder/Builder";

export const dynamic = "force-dynamic";

export default async function BuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const bot = await prisma.bot.findUnique({ where: { id: params.id } });
  if (!bot) notFound();

  return (
    <Builder
      initial={{
        id: bot.id,
        name: bot.name,
        slug: bot.slug,
        published: bot.published,
        flow: JSON.parse(bot.flow),
        theme: JSON.parse(bot.theme),
      }}
    />
  );
}
