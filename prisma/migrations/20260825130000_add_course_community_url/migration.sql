-- A per-course community invitation is private fulfillment data, just like the
-- meeting and Drive identifiers beside it. TEXT avoids an arbitrary URL limit.
ALTER TABLE "courses" ADD COLUMN "community_url" TEXT;

-- `courses` is already RLS-protected and revoked from Supabase Data API roles.
-- Repeat the grants invariant here so a drifted target cannot expose this URL.
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "courses" FROM anon, authenticated;
