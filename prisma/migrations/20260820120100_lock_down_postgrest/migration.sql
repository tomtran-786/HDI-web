-- Close the PostgREST door on every table in `public`.
--
-- Supabase serves the whole `public` schema over a REST API that anyone can
-- call with the project's anon key — a key that is designed to be published.
-- This app never uses that API: it talks to Postgres through Prisma as the
-- table owner. Without this migration, `cohorts.meeting_url` and
-- `cohorts.drive_folder_id` would be one anon-key request away from the public
-- internet, and every careful `select` in app/tai-khoan/page.tsx would be beside
-- the point.
--
-- ENABLE (not FORCE) row level security: a table owner bypasses its own RLS, so
-- Prisma keeps working untouched, while `anon` and `authenticated` match no
-- policy — and there are deliberately no policies — so they see nothing.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cohorts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;

-- Belt and braces: RLS governs row visibility, but TRUNCATE is not an RLS-checked
-- operation and Supabase's default grants hand anon more than it should have.
-- Take the privileges away outright.
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM anon, authenticated;

-- And for tables added by future migrations.
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM anon, authenticated;
