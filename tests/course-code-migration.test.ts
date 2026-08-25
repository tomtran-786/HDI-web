import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260825160000_add_course_code/migration.sql",
  ),
  "utf8",
);

describe("course code migration contract", () => {
  it("backfills every authored code before making the column required", () => {
    for (const code of [
      "AIQT",
      "TIEULUAN",
      "SPSS",
      "STATA",
      "TAPCHI",
      "BAOCAO",
      "CHATGPT",
    ]) {
      expect(sql).toContain(`THEN '${code}'`);
    }
    expect(sql.indexOf('UPDATE "courses"')).toBeLessThan(
      sql.indexOf('ALTER COLUMN "code" SET NOT NULL'),
    );
  });

  it("aborts on unknown slugs and installs format and uniqueness guards", () => {
    expect(sql).toContain("unknown slugs");
    expect(sql).toContain("courses_code_format_check");
    expect(sql).toContain("^[A-Z0-9]{2,12}$");
    expect(sql).toContain('CREATE UNIQUE INDEX "courses_code_key"');
  });

  it("does not rewrite commercial history", () => {
    expect(sql).not.toMatch(/(?:UPDATE|DELETE|ALTER TABLE)\s+"?(?:enrollments|orders|order_items|payments)"?/i);
  });
});
