import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

function findEnvFile(): string | null {
  const candidates = ["/app/.env", resolve(process.cwd(), ".env")];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  let dir = process.cwd();
  while (true) {
    const p = resolve(dir, ".env");
    if (existsSync(p)) return p;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  const p = findEnvFile();
  if (!p) return;
  const content = readFileSync(p, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}

loadEnv();

// Prisma's CLI resolves a relative SQLite path against the schema directory,
// while the runtime resolves it against the process cwd. Resolve relative
// `file:./x` URLs to an absolute path under ./prisma (where `db push` writes)
// so both ends agree.
if (
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.startsWith("file:./")
) {
  const rel = process.env.DATABASE_URL.slice("file:./".length);
  const abs = resolve(process.cwd(), "prisma", rel);
  process.env.DATABASE_URL = "file:" + abs;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
