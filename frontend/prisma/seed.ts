import { PrismaClient } from "@prisma/client";
import { emptyFlow, defaultTheme } from "../lib/flow";

const prisma = new PrismaClient();

async function main() {
  const flow = emptyFlow();
  flow.push(
    {
      id: "q1",
      type: "input",
      next: "q2",
      label: "What's your name?",
      placeholder: "Type here…",
      inputKind: "text",
      variable: "name",
    },
    {
      id: "q2",
      type: "buttons",
      next: null,
      label: "Are you interested?",
      variable: "interest",
      options: [
        { id: "o1", label: "Yes", value: "yes" },
        { id: "o2", label: "No", value: "no" },
      ],
      branches: [
        { id: "b1", label: "Yes", operator: "equals", value: "yes", next: "thanks" },
        { id: "b2", label: "No", operator: "equals", value: "no", next: null },
      ],
    },
    {
      id: "thanks",
      type: "text",
      next: null,
      content: "Great! We'll be in touch soon. 🎉",
    }
  );

  await prisma.bot.create({
    data: {
      name: "Demo bot",
      slug: "demo",
      published: true,
      flow: JSON.stringify(flow),
      theme: JSON.stringify(defaultTheme),
    },
  });
  console.log("Seeded demo bot at /b/demo");
}

main().finally(() => prisma.$disconnect());
