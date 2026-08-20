/**
 * Load .env.local before anything that reads process.env.
 *
 * This is a separate module because ES modules are evaluated in import order,
 * and every import in a file runs before the file's own first statement. A
 * `loadEnv()` call at the top of seed.ts therefore runs AFTER lib/prisma has
 * already been evaluated — and lib/prisma reads DATABASE_URL at module load.
 * The result is a seed script that connects to nothing and fails with
 * ECONNREFUSED. Importing this first is what fixes the ordering.
 *
 * The Prisma CLI is not affected: prisma.config.ts loads the same files for it.
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
