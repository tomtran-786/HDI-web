import "../prisma/load-env";
import { prisma } from "@/lib/prisma";
import { liveAccessWhere } from "@/lib/enrollment";
import { findCourse } from "@/lib/courses";
import { sendCourseCommunityReminderEmail } from "@/lib/email";

/**
 * Đổi link nhóm Zalo của khóa TIEULUAN sang nhóm mới, rồi nhắc mọi người đã trả
 * tiền (mua lẻ lẫn theo nhóm) vào nhóm mới.
 *
 * Chạy TAY một lần, không đưa vào cron:
 *
 *   # 1. Xem trước: link hiện tại, link đích, danh sách người nhận
 *   npx tsx scripts/remind-tieuluan-zalo.ts
 *
 *   # 2. Cập nhật cột courses.community_url
 *   npx tsx scripts/remind-tieuluan-zalo.ts --commit-link
 *
 *   # 3. Gửi thư nhắc (đọc link mới trong DB, nên chạy sau bước 2)
 *   npx tsx scripts/remind-tieuluan-zalo.ts --send-emails
 *
 * Có thể gộp: `--commit-link --send-emails`. Gửi thư không có dấu chống trùng —
 * mỗi lần chạy `--send-emails` là một lượt thư nữa cho mọi người, nên chỉ chạy
 * một lần.
 */

const COURSE_CODE = "TIEULUAN";
const NEW_COMMUNITY_URL = "https://zalo.me/g/phcy2fonp0qnctvqh77l";

// Resend cho phép ~2 thư/giây trên gói mặc định; nghỉ giữa các lần gửi.
const SEND_GAP_MS = 600;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = new Set(process.argv.slice(2));
  const commitLink = args.has("--commit-link");
  const sendEmails = args.has("--send-emails");
  const dryRun = !commitLink && !sendEmails;

  const course = await prisma.course.findUnique({
    where: { code: COURSE_CODE },
    select: { id: true, slug: true, communityUrl: true },
  });
  if (!course) {
    throw new Error(`Không tìm thấy khóa có code=${COURSE_CODE}`);
  }

  const title = findCourse(course.slug)?.title ?? course.slug;
  console.log(`Khóa: ${COURSE_CODE} · ${title}`);
  console.log(`  community_url hiện tại: ${course.communityUrl ?? "(chưa có)"}`);
  console.log(`  community_url đích     : ${NEW_COMMUNITY_URL}`);

  if (commitLink) {
    if (course.communityUrl === NEW_COMMUNITY_URL) {
      console.log("→ Link đã đúng, không cần cập nhật.");
    } else {
      await prisma.course.update({
        where: { id: course.id },
        data: { communityUrl: NEW_COMMUNITY_URL },
      });
      console.log("→ Đã cập nhật community_url.");
    }
  }

  // Người nhận: mọi ghi danh còn quyền truy cập khóa này. Một đơn nhóm giữ một
  // ghi danh cho mỗi thành viên, nên tập này đã gồm cả người mua lẻ, nhóm
  // trưởng và từng thành viên. Gộp theo email để một người mua nhiều lần chỉ
  // nhận một thư.
  const enrollments = await prisma.enrollment.findMany({
    where: { ...liveAccessWhere(new Date()), courseId: course.id },
    select: { user: { select: { email: true, name: true } } },
    orderBy: { paidAt: "asc" },
  });

  const byEmail = new Map<string, string>();
  for (const { user } of enrollments) {
    if (!byEmail.has(user.email)) byEmail.set(user.email, user.name ?? "");
  }

  console.log(
    `\nNgười nhận: ${byEmail.size} địa chỉ (từ ${enrollments.length} ghi danh còn hiệu lực)`,
  );
  for (const email of byEmail.keys()) console.log(`  - ${email}`);

  if (dryRun) {
    console.log(
      "\n(Chạy thử — chưa đổi link, chưa gửi thư. Thêm --commit-link và/hoặc --send-emails.)",
    );
    return;
  }

  if (!sendEmails) return;

  // Đọc lại link từ DB: thư phải trỏ tới đúng link đang lưu, kể cả khi chạy
  // riêng bước này mà chưa chạy --commit-link.
  const fresh = await prisma.course.findUnique({
    where: { id: course.id },
    select: { communityUrl: true },
  });
  const communityUrl = fresh?.communityUrl;
  if (!communityUrl) {
    throw new Error(
      "community_url đang trống — chạy --commit-link trước khi gửi thư.",
    );
  }

  let sent = 0;
  let failed = 0;
  for (const [email, name] of byEmail) {
    const result = await sendCourseCommunityReminderEmail({
      to: email,
      name,
      courseTitle: title,
      communityUrl,
    });
    if (result.sent) {
      sent += 1;
      console.log(`  ✓ ${email}`);
    } else {
      failed += 1;
      console.error(`  ✗ ${email} — ${result.error}`);
    }
    await sleep(SEND_GAP_MS);
  }
  console.log(`\nĐã gửi: ${sent} · Hỏng: ${failed}`);
}

main()
  .catch((error) => {
    console.error("Lỗi:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
