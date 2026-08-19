# FlowBot

A self-hostable, visual chatbot / conversational-flow builder — like Typeform but for chat bots. Built with **Next.js 14 (App Router)**, **Prisma + SQLite**, and **Tailwind CSS**.

## Features

- 🧩 **Visual editor** — drag-and-drop blocks to build a conversational flow
  - Text messages, Images
  - User inputs: text / email / number / phone, Date picker, Buttons
  - Stripe payment step (stub — wire your keys)
- 🔀 **Branching logic** — route the conversation based on the user's answer
- 🎨 **Theme customization** — colors, fonts, corner radius, bubble/popup, position
- 💻 **Embed anywhere** — copy one `<script>` tag to add a chat bubble / popup to any site
- 📊 **Dashboard + analytics** — conversations, completion rate, 14-day activity, and **CSV export** of all answers
- 🐳 **Easy Docker deploy**

## Quick start (local)

```bash
npm install
cp .env.example .env   # sets DATABASE_URL (SQLite)
npx prisma db push
npm run db:seed        # optional demo bot at /b/demo
npm run dev
```

Open http://localhost:3000 → you'll be redirected to the dashboard.

## Docker

```bash
docker compose up --build
```

The app runs on port 3000 with a persistent SQLite database in a named volume
(`db-data`). For production, set `DATABASE_URL` and mount a volume at `/data`.

To switch to Postgres, change the `datasource` provider in `prisma/schema.prisma`
and point `DATABASE_URL` at your instance, then run `prisma db push`.

## Project layout

```
app/
  api/bots/…            bot CRUD + analytics + CSV export
  api/runtime/[slug]/…  public runtime: fetch flow, start, answer
  builder/[id]/         visual editor
  bots/[id]/analytics/  dashboard
  b/[slug]/             public bot page (used by embeds)
components/
  ChatWidget.tsx        the chat runtime UI (preview, live, embed)
  builder/Builder.tsx   the visual editor
public/embed.js         drop-in embed script
lib/
  flow.ts               block + theme types
  engine.ts             next-block / branching logic
  prisma.ts             db client
prisma/schema.prisma    data model
```

## Embedding a published bot

From the builder's **Embed** tab (publish the bot first):

```html
<script
  src="https://your-server/embed.js"
  data-slug="demo"
  data-type="bubble"
  data-position="right"
  data-bubble-text="Chat with us"
></script>
```

## Notes / limitations

- Authentication is **not** included (single-tenant / self-hosted assumption). Add auth
  before exposing publicly.
- Stripe is a **UI stub**: the block records a "paid" answer but does not call Stripe.
  Wire `lib/...` / a server route to create Checkout Sessions for real payments.
- Answers are stored per-conversation; the CSV export pivots variables into columns.
