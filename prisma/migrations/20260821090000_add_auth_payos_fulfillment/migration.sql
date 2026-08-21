-- Credential authentication, PayOS checkout metadata, and external-service
-- coordination. This migration is forward-only and preserves every existing
-- order's stamped expires_at value.

-- Email login is case-insensitive. Abort before changing data if normalization
-- would merge two existing accounts; that conflict requires a human decision.
DO $$
BEGIN
  IF EXISTS (
    SELECT lower("email")
      FROM "users"
     GROUP BY lower("email")
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot normalize users.email: case-insensitive duplicates exist';
  END IF;
END $$;

UPDATE "users" SET "email" = lower(trim("email"));

ALTER TABLE "users"
  ADD COLUMN "password_hash" VARCHAR(100),
  ADD COLUMN "sessions_valid_after" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (lower("email"));
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE INDEX "verification_tokens_identifier_idx" ON "verification_tokens"("identifier");

CREATE TABLE "auth_throttles" (
  "action" VARCHAR(32) NOT NULL,
  "key_hash" CHAR(64) NOT NULL,
  "window_start" TIMESTAMPTZ(6) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "auth_throttles_pkey" PRIMARY KEY ("action", "key_hash", "window_start"),
  CONSTRAINT "auth_throttles_count_check" CHECK ("count" > 0)
);

CREATE INDEX "auth_throttles_expires_at_idx" ON "auth_throttles"("expires_at");

CREATE TABLE "external_sync_leases" (
  "resource_key" VARCHAR(180) NOT NULL,
  "owner" VARCHAR(80) NOT NULL,
  "locked_until" TIMESTAMPTZ(6) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "external_sync_leases_pkey" PRIMARY KEY ("resource_key")
);

CREATE INDEX "external_sync_leases_locked_until_idx" ON "external_sync_leases"("locked_until");

ALTER TYPE "payment_status" ADD VALUE 'requires_review';

ALTER TABLE "orders" ADD COLUMN "checkout_url" TEXT;
CREATE INDEX "payments_status_received_at_idx" ON "payments"("status", "received_at");

-- These tables are internal queues/security state. The app uses a direct
-- Postgres connection as table owner; no browser/Data API role needs access.
ALTER TABLE "auth_throttles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "external_sync_leases" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "auth_throttles", "external_sync_leases" FROM anon, authenticated;
