/**
 * Seed / update sellable courses from prisma/courses.json.
 *
 * That file is gitignored because it carries private meeting/access data.
 *   npx tsx prisma/seed.ts
 *
 * Idempotent: upserts on the unique slug, so re-running updates rather than
 * duplicating.
 */
// MUST come first: it sets DATABASE_URL, which ../lib/prisma reads the moment
// it is imported. See prisma/load-env.ts.
import "./load-env";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { courses } from "../content/course";
import { prisma } from "../lib/prisma";

type SeedCourse = {
  slug: string;
  capacity: number;
  priceVnd: number;
  accessDays?: number | null;
  status?: "draft" | "open" | "running" | "closed";
  meetingUrl?: string | null;
  communityUrl?: string | null;
  driveFolderId?: string | null;
};

async function main() {
  const file = join(process.cwd(), "prisma", "courses.json");
  if (!existsSync(file)) {
    console.error(
      "Không tìm thấy prisma/courses.json.\n" +
        "Chép prisma/courses.example.json thành prisma/courses.json rồi điền dữ liệu thật.",
    );
    process.exit(1);
  }

  const rows: SeedCourse[] = JSON.parse(readFileSync(file, "utf8"));
  const known = new Set(courses.map((c) => c.slug));

  // Validate everything before writing anything: a half-applied seed is worse
  // than a rejected one.
  const bad = rows.filter((r) => !known.has(r.slug as never));
  if (bad.length > 0) {
    console.error(
      "slug không khớp khóa nào trong content/course.ts:\n" +
        bad.map((b) => `  - "${b.slug}"`).join("\n") +
        `\nCác slug hợp lệ: ${[...known].join(", ")}`,
    );
    process.exit(1);
  }

  const duplicates = rows
    .map((r) => r.slug)
    .filter((slug, index, all) => all.indexOf(slug) !== index);
  if (duplicates.length > 0) {
    console.error(`Mỗi khóa chỉ được xuất hiện một lần: ${[...new Set(duplicates)].join(", ")}`);
    process.exit(1);
  }

  const invalidNumbers = rows.filter(
    (r) =>
      !Number.isInteger(r.capacity) ||
      r.capacity <= 0 ||
      !Number.isInteger(r.priceVnd) ||
      r.priceVnd <= 0 ||
      (r.accessDays != null && (!Number.isInteger(r.accessDays) || r.accessDays <= 0)),
  );
  if (invalidNumbers.length > 0) {
    console.error(
      `capacity, priceVnd và accessDays phải là số nguyên dương: ${invalidNumbers.map((r) => r.slug).join(", ")}`,
    );
    process.exit(1);
  }

  for (const r of rows) {
    const data = {
      capacity: r.capacity,
      priceVnd: r.priceVnd,
      accessDays: r.accessDays ?? null,
      status: r.status ?? "draft",
      meetingUrl: r.meetingUrl ?? null,
      communityUrl: r.communityUrl ?? null,
      driveFolderId: r.driveFolderId ?? null,
    };
    await prisma.course.upsert({
      where: { slug: r.slug },
      create: { slug: r.slug, ...data },
      update: data,
    });
    console.log(`✓ ${r.slug}`);
  }
  console.log(`\nĐã đồng bộ ${rows.length} khóa học.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
