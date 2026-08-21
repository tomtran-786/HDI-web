import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

// The Prisma CLI does not read .env.local on its own the way Next.js does.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // DDL goes through the SESSION-mode pooler (:5432). The app itself uses the
    // TRANSACTION-mode pooler (:6543) — see lib/prisma.ts for why that split is
    // not optional.
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "",
  },
});
