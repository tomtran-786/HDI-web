import "../prisma/load-env";
import { prisma } from "@/lib/prisma";

/**
 * Đọc-only: soi vì sao một người giới thiệu chưa được ghi hoa hồng.
 *
 *   npx tsx scripts/referral-debug.ts <userId người giới thiệu> [mã khóa]
 *
 * Không có giá trị mặc định nào. Một script chẩn đoán mang sẵn id của một người
 * thật là hai chuyện cùng lúc: dữ liệu cá nhân nằm vĩnh viễn trong repo, và một
 * lần chạy quên tham số sẽ in ra hồ sơ của người không liên quan.
 */

const REFERRER_ID = process.argv[2];
const COURSE_CODE = process.argv[3] ?? "TIEULUAN";

if (!REFERRER_ID) {
  console.error(
    "Thiếu tham số.\n" +
      "  npx tsx scripts/referral-debug.ts <userId người giới thiệu> [mã khóa]",
  );
  process.exit(1);
}

const vnd = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("vi-VN") + " đ";

async function main() {
  const referrer = await prisma.user.findUnique({
    where: { id: REFERRER_ID },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      referredById: true,
      createdAt: true,
    },
  });
  console.log("=== NGƯỜI GIỚI THIỆU ===");
  console.log(referrer ?? "(không tìm thấy user)");

  // Ai đang mang referredById = REFERRER_ID
  const referred = await prisma.user.findMany({
    where: { referredById: REFERRER_ID },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\n=== users.referredById = ${REFERRER_ID}: ${referred.length} ===`);
  for (const u of referred) {
    console.log(`  ${u.name} · ${u.email} · ${u.id} · tạo ${u.createdAt.toISOString()}`);
  }

  // Học viên paid của TIEULUAN + trạng thái referredById của họ
  const course = await prisma.course.findUnique({
    where: { code: COURSE_CODE },
    select: { id: true },
  });
  const seats = await prisma.orderItem.findMany({
    where: { courseId: course!.id, enrollment: { status: "paid" } },
    select: {
      priceVnd: true,
      member: {
        select: {
          id: true,
          name: true,
          email: true,
          referredById: true,
          referrer: { select: { id: true, name: true, email: true } },
        },
      },
      order: {
        select: {
          id: true,
          code: true,
          userId: true,
          amountVnd: true,
          groupSize: true,
          referralDiscountVnd: true,
          creditAppliedVnd: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ order: { code: "asc" } }],
  });

  console.log(`\n=== GHẾ PAID KHÓA ${COURSE_CODE} ===`);
  for (const s of seats) {
    console.log(
      `  #${s.order.code} seat=${s.member.name} <${s.member.email}> id=${s.member.id}\n` +
        `     referredById=${s.member.referredById ?? "null"}` +
        (s.member.referrer
          ? ` (${s.member.referrer.name} <${s.member.referrer.email}>)`
          : "") +
        `\n     order.userId(nhóm trưởng)=${s.order.userId} groupSize=${s.order.groupSize}` +
        ` amountVnd=${vnd(s.order.amountVnd)} seat=${vnd(s.priceVnd)}` +
        ` refDiscount=${vnd(s.order.referralDiscountVnd)} creditApplied=${vnd(s.order.creditAppliedVnd)}` +
        ` paidAt=${s.order.paidAt?.toISOString() ?? "—"}`,
    );
  }

  // Toàn bộ ledger của người giới thiệu
  const ledger = await prisma.referralLedger.findMany({
    where: { userId: REFERRER_ID },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\n=== referral_ledger WHERE user_id = ${REFERRER_ID}: ${ledger.length} dòng ===`);
  for (const l of ledger) {
    console.log(
      `  ${l.createdAt.toISOString()} ${l.type}/${l.status} amount=${vnd(l.amountVnd)}` +
        ` basis=${vnd(l.basisVnd)} rate=${l.ratePct ?? "—"}%` +
        ` orderId=${l.orderId ?? "—"} refereeUserId=${l.refereeUserId ?? "—"}` +
        ` availableAt=${l.availableAt?.toISOString() ?? "—"} note=${l.note ?? ""}`,
    );
  }

  // Ledger nơi bất kỳ học viên nào là referee
  const memberIds = [...new Set(seats.map((s) => s.member.id))];
  const asReferee = await prisma.referralLedger.findMany({
    where: { refereeUserId: { in: memberIds } },
    select: {
      type: true,
      status: true,
      amountVnd: true,
      userId: true,
      refereeUserId: true,
      orderId: true,
      createdAt: true,
    },
  });
  console.log(
    `\n=== referral_ledger WHERE referee ∈ học viên TIEULUAN: ${asReferee.length} dòng ===`,
  );
  for (const l of asReferee) {
    console.log(
      `  ${l.createdAt.toISOString()} ${l.type}/${l.status} amount=${vnd(l.amountVnd)}` +
        ` owner=${l.userId} referee=${l.refereeUserId} orderId=${l.orderId ?? "—"}`,
    );
  }

  // Có bao nhiêu đơn paid mà mỗi học viên này từng có (để biết đơn TIEULUAN có phải "đơn đầu tiên")
  console.log(`\n=== LỊCH SỬ ĐƠN PAID CỦA TỪNG HỌC VIÊN ===`);
  for (const id of memberIds) {
    const orders = await prisma.order.findMany({
      where: { status: "paid", OR: [{ userId: id }, { items: { some: { memberUserId: id } } }] },
      select: { code: true, amountVnd: true, groupSize: true, paidAt: true, userId: true },
      orderBy: { paidAt: "asc" },
    });
    const who = seats.find((s) => s.member.id === id)?.member;
    console.log(`  ${who?.name} <${who?.email}> (${id}): ${orders.length} đơn paid`);
    for (const o of orders) {
      console.log(
        `     #${o.code} amount=${vnd(o.amountVnd)} groupSize=${o.groupSize}` +
          ` leader=${o.userId === id ? "chính họ" : o.userId} paidAt=${o.paidAt?.toISOString()}`,
      );
    }
  }
}

main()
  .catch((e) => {
    console.error("Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
