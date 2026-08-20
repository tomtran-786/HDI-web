import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

/**
 * Serverless-tuned Prisma singleton.
 *
 * Ported from the Chemistery codebase, including the reason it looks like this:
 * DATABASE_URL MUST be the transaction-mode pooler (port 6543). Session mode
 * (5432) pins one Postgres backend per client connection; on Vercel a lambda
 * frozen between requests holds that socket open forever, the pool drains, and
 * the whole app loses its database. That is not hypothetical — it took that app
 * down once already.
 *
 * The Prisma CLI is the opposite case and does want session mode; prisma.config.ts
 * points it at DIRECT_DATABASE_URL.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL ?? "";
  if (!connectionString) {
    console.warn(
      "⚠️ DATABASE_URL chưa được thiết lập. Xem .env.example — cần chuỗi Supabase transaction pooler (:6543).",
    );
  }

  const pool = new Pool({
    connectionString,
    // One connection per lambda is enough — the transaction pooler multiplexes
    // behind it. Locally, 5 covers HMR plus a few parallel routes.
    max: Number(process.env.PG_POOL_MAX) || (process.env.VERCEL ? 1 : 5),
    // Give idle connections back quickly rather than squatting on pooler slots.
    idleTimeoutMillis: 10_000,
    // Fail loudly after 10s instead of hanging forever when the pool is full.
    connectionTimeoutMillis: 10_000,
  });

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Survive HMR in dev without opening a new pool on every reload.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
