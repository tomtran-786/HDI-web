import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260821190113_replace_cohorts_with_courses/migration.sql",
  ),
  "utf8",
);

describe("Cohort to Course migration contract", () => {
  it("rejects duplicate slugs before changing the schema", () => {
    const guard = sql.indexOf("HAVING count(*) > 1");
    const firstRename = sql.indexOf('ALTER TYPE "cohort_status" RENAME');
    expect(guard).toBeGreaterThan(-1);
    expect(firstRename).toBeGreaterThan(guard);
    expect(sql).toContain("duplicate course_slug values");
  });

  it("renames identifiers in place and never deletes commercial history", () => {
    expect(sql).toContain('ALTER TABLE "cohorts" RENAME TO "courses"');
    expect(sql).toContain('RENAME COLUMN "cohort_id" TO "course_id"');
    expect(sql).toContain('RENAME COLUMN "course_slug" TO "slug"');
    expect(sql).not.toMatch(/DELETE\s+FROM\s+"?(cohorts|enrollments|orders|payments)/i);
  });

  it("installs active-only uniqueness, FK indexes and PostgREST lockdown", () => {
    expect(sql).toContain('"enrollments_user_id_course_id_active_key"');
    expect(sql).toContain('"status" = \'pending\'::"enrollment_status"');
    expect(sql).toContain('"access_revoked_at" IS NULL');
    expect(sql).toContain('"enrollments_course_id_status_idx"');
    expect(sql).toContain('"order_items_course_id_idx"');
    expect(sql).toContain('ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('REVOKE ALL ON "courses" FROM anon, authenticated');
  });
});
