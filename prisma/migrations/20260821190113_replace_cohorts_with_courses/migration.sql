-- Replace per-intake cohorts with one fixed commercial/access record per
-- authored course. IDs are deliberately preserved: enrollments, order items
-- and browser carts continue to name the same records after the rename.

-- The new model cannot represent two sale records for one course. Abort before
-- changing anything and report every conflicting slug instead of guessing
-- which price, folder or access policy should win.
DO $$
DECLARE
  conflicts text;
BEGIN
  SELECT string_agg(format('%s (%s rows)', course_slug, row_count), ', ' ORDER BY course_slug)
    INTO conflicts
    FROM (
      SELECT course_slug, count(*) AS row_count
        FROM cohorts
       GROUP BY course_slug
      HAVING count(*) > 1
    ) duplicate_courses;

  IF conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot replace cohorts with courses; duplicate course_slug values: %', conflicts;
  END IF;
END $$;

-- Drop indexes that mention intake-only columns before removing those columns.
DROP INDEX "cohorts_status_khai_giang_idx";
DROP INDEX "cohorts_course_slug_ky_key";

-- Rename in place so every existing primary/foreign-key value survives.
ALTER TYPE "cohort_status" RENAME TO "course_status";
ALTER TABLE "cohorts" RENAME TO "courses";
ALTER TABLE "courses" RENAME CONSTRAINT "cohorts_pkey" TO "courses_pkey";
ALTER TABLE "courses" RENAME COLUMN "course_slug" TO "slug";
ALTER TABLE "courses"
  DROP COLUMN "ky",
  DROP COLUMN "khai_giang",
  DROP COLUMN "lich_hoc";

CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
CREATE INDEX "courses_status_idx" ON "courses"("status");

ALTER TABLE "enrollments" RENAME COLUMN "cohort_id" TO "course_id";
ALTER TABLE "enrollments"
  RENAME CONSTRAINT "enrollments_cohort_id_fkey" TO "enrollments_course_id_fkey";
ALTER INDEX "enrollments_cohort_id_status_idx"
  RENAME TO "enrollments_course_id_status_idx";
DROP INDEX "enrollments_user_id_cohort_id_key";

-- Keep all historical enrollment rows, but permit a new purchase after the
-- previous paid access was successfully revoked. A paid-but-expired row whose
-- Drive revoke failed intentionally remains active and still blocks a new seat.
CREATE UNIQUE INDEX "enrollments_user_id_course_id_active_key"
  ON "enrollments"("user_id", "course_id")
  WHERE (
    "status" = 'pending'::"enrollment_status"
    OR (
      "status" = 'paid'::"enrollment_status"
      AND "access_revoked_at" IS NULL
    )
  );

ALTER TABLE "order_items" RENAME COLUMN "cohort_id" TO "course_id";
ALTER TABLE "order_items"
  RENAME CONSTRAINT "order_items_cohort_id_fkey" TO "order_items_course_id_fkey";
ALTER INDEX "order_items_cohort_id_idx" RENAME TO "order_items_course_id_idx";
ALTER INDEX "order_items_order_id_cohort_id_key"
  RENAME TO "order_items_order_id_course_id_key";

-- Renaming preserves RLS state and grants in PostgreSQL. Repeat the lockdown
-- explicitly so the security invariant is visible and testable in this
-- migration, even on a database whose prior grants drifted.
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "courses" FROM anon, authenticated;
