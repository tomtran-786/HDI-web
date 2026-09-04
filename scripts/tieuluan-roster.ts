import "../prisma/load-env";
import { prisma } from "@/lib/prisma";
import { findCourse } from "@/lib/courses";

/**
 * Đọc-only: liệt kê học viên đã đăng ký khóa TIEULUAN.
 *
 *   npx tsx scripts/tieuluan-roster.ts            # chỉ ghi danh đã thanh toán (paid)
 *   npx tsx scripts/tieuluan-roster.ts --all      # kèm cả pending / cancelled / refunded
 *
 * Mỗi dòng là MỘT ghế (một order_item) = một học viên trên một đơn.
 */

const COURSE_CODE = "TIEULUAN";

const vnd = (n: number) => n.toLocaleString("vi-VN") + " đ";

async function main() {
  const withAll = process.argv.slice(2).includes("--all");

  const course = await prisma.course.findUnique({
    where: { code: COURSE_CODE },
    select: { id: true, slug: true, priceVnd: true, groupPriceVnd: true },
  });
  if (!course) throw new Error(`Không tìm thấy khóa code=${COURSE_CODE}`);

  const title = findCourse(course.slug)?.title ?? course.slug;

  const items = await prisma.orderItem.findMany({
    where: {
      courseId: course.id,
      ...(withAll ? {} : { enrollment: { status: "paid" } }),
    },
    select: {
      priceVnd: true,
      enrollment: { select: { status: true, paidAt: true } },
      member: { select: { name: true, phone: true, email: true } },
      order: {
        select: {
          code: true,
          status: true,
          amountVnd: true,
          groupSize: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ order: { code: "asc" } }],
  });

  // Đếm theo trạng thái ghi danh để báo cáo cho đủ.
  const byStatus = new Map<string, number>();
  for (const it of items) {
    const s = it.enrollment?.status ?? "(no-enrollment)";
    byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
  }

  console.log(`Khóa: ${COURSE_CODE} · ${title}`);
  console.log(
    `Giá lẻ: ${vnd(course.priceVnd)}` +
      (course.groupPriceVnd ? ` · giá nhóm/ghế: ${vnd(course.groupPriceVnd)}` : ""),
  );
  console.log(
    `Tổng số ghế lấy ra: ${items.length}` +
      (withAll ? " (mọi trạng thái)" : " (chỉ paid)"),
  );
  console.log(
    "Theo trạng thái ghi danh: " +
      [...byStatus.entries()].map(([s, n]) => `${s}=${n}`).join(", "),
  );

  const rows = items.map((it) => ({
    "Tên học viên": it.member.name ?? "",
    "Số điện thoại": it.member.phone ?? "",
    Email: it.member.email,
    "Mã đơn": it.order.code,
    "Giá trị đơn": it.order.amountVnd,
    "Giá ghế": it.priceVnd,
    "Thành viên nhóm": it.order.groupSize > 1,
    ...(withAll
      ? {
          "TT ghi danh": it.enrollment?.status ?? "(none)",
          "TT đơn": it.order.status,
        }
      : {}),
  }));

  console.log("\n--- BẢNG ---\n");
  console.table(rows);

  // CSV để dán ra ngoài.
  const headers = Object.keys(rows[0] ?? { "Tên học viên": "" });
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = (r as Record<string, unknown>)[h];
          const s = typeof v === "string" ? v : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    ),
  ].join("\n");
  console.log("\n--- CSV ---\n");
  console.log(csv);
}

main()
  .catch((e) => {
    console.error("Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
