import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

const configured = {};
loadEnv({ path: ".env.local", processEnv: configured, quiet: true });
loadEnv({ path: ".env", processEnv: configured, quiet: true });

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  console.error(
    "TEST_DATABASE_URL is required. Point it at a disposable Postgres database.",
  );
  process.exit(1);
}
const protectedUrls = new Set(
  [
    process.env.DATABASE_URL,
    process.env.DIRECT_DATABASE_URL,
    configured.DATABASE_URL,
    configured.DIRECT_DATABASE_URL,
  ].filter(Boolean),
);
if (protectedUrls.has(testUrl)) {
  console.error("Refusing to run integration tests against the configured HDI database.");
  process.exit(1);
}
if (process.env.HDI_TEST_DATABASE_CONFIRM_DISPOSABLE !== "1") {
  console.error(
    "Set HDI_TEST_DATABASE_CONFIRM_DISPOSABLE=1 after confirming the database may be migrated and mutated.",
  );
  process.exit(1);
}

// A clean PostgreSQL image does not include the PostgREST roles that Supabase
// creates for every project. The production migrations intentionally revoke
// those roles, so reproduce that prerequisite in the explicitly disposable
// cluster before applying the migration history. POSTGRES_USER in the local
// container (or the owner of a remote disposable test cluster) must have
// CREATEROLE for this one-time bootstrap.
const bootstrap = new Client({ connectionString: testUrl });
try {
  await bootstrap.connect();
  await bootstrap.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
    END $$;
  `);
} catch (error) {
  console.error(
    "Could not bootstrap Supabase browser roles in the disposable database.",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
} finally {
  await bootstrap.end().catch(() => undefined);
}

const executable = (name) =>
  resolve(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? `${name}.cmd` : name);
const env = {
  ...process.env,
  DATABASE_URL: testUrl,
  DIRECT_DATABASE_URL: testUrl,
  AUTH_SECRET: process.env.AUTH_SECRET || "integration-test-secret-not-for-production",
  NODE_ENV: "test",
};

for (const [command, args] of [
  [executable("prisma"), ["migrate", "deploy"]],
  [executable("vitest"), ["run", "--config", "vitest.integration.config.mts"]],
]) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
