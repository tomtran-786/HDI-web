/**
 * Seed / update cohorts from prisma/cohorts.json.
 *
 * That file is gitignored because it carries private schedule/meeting data.
 * Course-level Drive folders live in the separately gitignored
 * prisma/drive-folders.json and are used as defaults for every cohort. A
 * cohort may still override its folder with `driveFolderId` when needed.
 *
 *   npx tsx prisma/seed.ts
 *
 * Idempotent: upserts on the (courseSlug, ky) unique key, so re-running updates
 * rather than duplicating.
 */
// MUST come first: it sets DATABASE_URL, which ../lib/prisma reads the moment
// it is imported. See prisma/load-env.ts.
import "./load-env";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { courses } from "../content/course";
import { prisma } from "../lib/prisma";

type SeedCohort = {
  courseSlug: string;
  ky: string;
  khaiGiang: string;
  lichHoc: string;
  capacity: number;
  priceVnd: number;
  accessDays?: number | null;
  status?: "draft" | "open" | "running" | "closed";
  meetingUrl?: string | null;
  driveFolderId?: string | null;
};

function loadDriveFolders(known: Set<string>) {
  const file = join(process.cwd(), "prisma", "drive-folders.json");
  if (!existsSync(file)) return new Map<string, string>();

  const parsed = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  const entries = Object.entries(parsed);
  const invalid = entries.filter(
    ([slug, folderId]) =>
      !known.has(slug) ||
      typeof folderId !== "string" ||
      !/^[A-Za-z0-9_-]{10,100}$/.test(folderId),
  );
  if (invalid.length > 0) {
    throw new Error(
      "prisma/drive-folders.json chứa courseSlug hoặc Google Drive folder ID không hợp lệ: " +
        invalid.map(([slug]) => slug).join(", "),
    );
  }
  return new Map(entries as [string, string][]);
}

async function main() {
  const file = join(process.cwd(), "prisma", "cohorts.json");
  if (!existsSync(file)) {
    console.error(
      "Không tìm thấy prisma/cohorts.json.\n" +
        "Chép prisma/cohorts.example.json thành prisma/cohorts.json rồi điền dữ liệu thật.",
    );
    process.exit(1);
  }

  const rows: SeedCohort[] = JSON.parse(readFileSync(file, "utf8"));
  const known = new Set(courses.map((c) => c.slug));
  const driveFolders = loadDriveFolders(known);

  // Validate everything before writing anything: a half-applied seed is worse
  // than a rejected one.
  const bad = rows.filter((r) => !known.has(r.courseSlug as never));
  if (bad.length > 0) {
    console.error(
      "courseSlug không khớp khóa nào trong content/course.ts:\n" +
        bad.map((b) => `  - "${b.courseSlug}" (kỳ ${b.ky})`).join("\n") +
        `\nCác slug hợp lệ: ${[...known].join(", ")}`,
    );
    process.exit(1);
  }

  for (const r of rows) {
    const data = {
      khaiGiang: new Date(r.khaiGiang),
      lichHoc: r.lichHoc,
      capacity: r.capacity,
      priceVnd: r.priceVnd,
      accessDays: r.accessDays ?? null,
      status: r.status ?? "draft",
      meetingUrl: r.meetingUrl ?? null,
      driveFolderId: r.driveFolderId ?? driveFolders.get(r.courseSlug) ?? null,
    };
    await prisma.cohort.upsert({
      where: { courseSlug_ky: { courseSlug: r.courseSlug, ky: r.ky } },
      create: { courseSlug: r.courseSlug, ky: r.ky, ...data },
      update: data,
    });
    console.log(`✓ ${r.courseSlug} — ${r.ky}`);
  }
  console.log(`\nĐã đồng bộ ${rows.length} kỳ học.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
