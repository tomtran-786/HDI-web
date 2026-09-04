import "../prisma/load-env";
import { prisma } from "@/lib/prisma";
import {
  REFERRAL_COMMISSION_PCT,
  REWARDED_REFERRALS_MAX,
  commissionExpiresAt,
  referralCommissionVnd,
} from "@/lib/referral-pricing";
import {
  creditBalanceVnd,
  pendingCreditVnd,
  rewardedReferralsInWindow,
} from "@/lib/referral-ledger";

/**
 * MỘT LẦN — bù bốn khoản hoa hồng bị mất cho người giới thiệu "Vũ Hằng".
 *
 * Bối cảnh: cả bốn học viên đứng tên trả bốn đơn dưới đây đăng ký tài khoản
 * KHÔNG kèm mã giới thiệu, nên `users.referred_by_id` của họ để trống và webhook
 * PayOS không ghi được dòng `commission` nào cho Vũ Hằng. Chủ dự án xác nhận
 * bốn đơn này là do cô ấy dẫn về và yêu cầu cộng bù (quyết định E trong
 * plan). Đơn #100040 (Tom Tran) là tài khoản test của chủ dự án — KHÔNG tính.
 *
 * Luật "chỉ người trả tiền mới sinh hoa hồng" giữ nguyên: ba trong bốn đơn là
 * đơn của chính người mua đứng tên trả (kể cả nhóm trưởng của đơn nhóm).
 *
 *   npx tsx scripts/backfill-referral-vuhang.ts            # xem trước, không ghi
 *   npx tsx scripts/backfill-referral-vuhang.ts --commit   # ghi sổ
 *
 * Idempotent: chạy lại sẽ bỏ qua đơn đã có dòng `commission`. Hai partial
 * unique index (`referral_ledger_commission_order_key`,
 * `referral_ledger_commission_referee_key`) là lớp chặn thứ hai ở tầng DB.
 */

const REFERRER_ID = "cmtimpzqo000004kzz0n9dp0o"; // Vũ Hằng · mã SKGAXBZR

/** Căn cứ tính hoa hồng = order.amountVnd + order.creditAppliedVnd. */
const EXPECTED: Record<number, { basisVnd: number; payerName: string }> = {
  100032: { basisVnd: 300_000, payerName: "Nguyễn Phạm Thảo Nguyên" },
  100036: { basisVnd: 750_000, payerName: "Như Y" },
  100039: { basisVnd: 300_000, payerName: "Hugo Nguyen" },
  100042: { basisVnd: 750_000, payerName: "Thùy Vân" },
};
// #100040 (Tom Tran) — tài khoản test của chủ dự án, cố ý bỏ ngoài danh sách.

const vnd = (n: number) => n.toLocaleString("vi-VN") + " đ";

async function main() {
  const commit = process.argv.slice(2).includes("--commit");
  const now = new Date();

  const referrer = await prisma.user.findUnique({
    where: { id: REFERRER_ID },
    select: { name: true, email: true, referralCode: true },
  });
  if (!referrer) throw new Error(`Không tìm thấy user ${REFERRER_ID}`);
  console.log(
    `Người giới thiệu: ${referrer.name} <${referrer.email}> · mã ${referrer.referralCode}`,
  );

  const alreadyRewarded = await rewardedReferralsInWindow(prisma, REFERRER_ID, now);
  const codes = Object.keys(EXPECTED).map(Number);
  console.log(
    `Đã thưởng trong cửa sổ 6 tháng: ${alreadyRewarded} · trần: ${REWARDED_REFERRALS_MAX}`,
  );

  const balanceBefore = await creditBalanceVnd(prisma, REFERRER_ID, now);
  const pendingBefore = await pendingCreditVnd(prisma, REFERRER_ID, now);
  console.log(
    `Số dư hiện tại: ${vnd(balanceBefore)} (đang giữ: ${vnd(pendingBefore)})\n`,
  );

  type Row = {
    userId: string;
    type: "commission";
    status: "posted";
    amountVnd: number;
    orderId: string;
    refereeUserId: string;
    ratePct: number;
    basisVnd: number;
    note: string;
    availableAt: Date;
    expiresAt: Date;
  };
  const rows: Row[] = [];

  for (const code of codes) {
    const want = EXPECTED[code];
    const order = await prisma.order.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        userId: true,
        status: true,
        amountVnd: true,
        creditAppliedVnd: true,
        paidAt: true,
      },
    });
    if (!order) {
      console.log(`#${code}: KHÔNG tìm thấy đơn — bỏ qua.`);
      continue;
    }
    if (order.status !== "paid" || !order.paidAt) {
      console.log(`#${code}: trạng thái "${order.status}", chưa paid — bỏ qua.`);
      continue;
    }

    const basisVnd = order.amountVnd + order.creditAppliedVnd;
    if (order.creditAppliedVnd !== 0 || basisVnd !== want.basisVnd) {
      console.log(
        `#${code}: căn cứ lệch (amount ${vnd(order.amountVnd)} + credit ` +
          `${vnd(order.creditAppliedVnd)} = ${vnd(basisVnd)}, kỳ vọng ${vnd(want.basisVnd)}) — bỏ qua.`,
      );
      continue;
    }

    const payer = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { name: true, email: true, referredById: true },
    });
    const flag =
      payer?.referredById === REFERRER_ID
        ? "(đã gán đúng)"
        : payer?.referredById
          ? `(referredById = ${payer.referredById} — KHÁC)`
          : "(referredById trống — đúng lý do phải bù)";
    console.log(
      `#${code}: người trả tiền ${payer?.name} <${payer?.email}> ${flag}`,
    );
    if (
      payer?.name &&
      !payer.name.toLowerCase().includes(want.payerName.toLowerCase().split(" ").pop()!)
    ) {
      console.log(
        `  ⚠ tên "${payer.name}" không khớp kỳ vọng "${want.payerName}" — kiểm tra lại.`,
      );
    }

    const existing = await prisma.referralLedger.findFirst({
      where: { orderId: order.id, type: "commission" },
      select: { id: true, userId: true, amountVnd: true },
    });
    if (existing) {
      console.log(
        `  → đã có dòng commission (${existing.id}, owner ${existing.userId}, ${vnd(existing.amountVnd)}) — bỏ qua.`,
      );
      continue;
    }

    const amountVnd = referralCommissionVnd(basisVnd);
    rows.push({
      userId: REFERRER_ID,
      type: "commission",
      status: "posted",
      amountVnd,
      orderId: order.id,
      refereeUserId: order.userId,
      ratePct: REFERRAL_COMMISSION_PCT,
      basisVnd,
      // <= 200 ký tự (cột VarChar(200)).
      note: `Bù hoa hồng thủ công: đơn #${order.code}, người được giới thiệu đăng ký không kèm mã nên referredById bị mất`,
      // Quyết định E: cho tiêu được ngay (hold 7 ngày lẽ ra đã hết từ ~09-10/09).
      availableAt: now,
      // Neo theo sự kiện kinh tế: 6 tháng kể từ lúc thanh toán, không phải +6mo từ giờ.
      expiresAt: commissionExpiresAt(order.paidAt),
    });
    console.log(`  → dự kiến ghi ${vnd(amountVnd)} (10% × ${vnd(basisVnd)}).`);
  }

  console.log(
    `\nTổng dự kiến ghi: ${rows.length} dòng · ${vnd(rows.reduce((s, r) => s + r.amountVnd, 0))}`,
  );
  console.log(
    `Số dư sau khi ghi (dự kiến): ${vnd(balanceBefore + rows.reduce((s, r) => s + r.amountVnd, 0))}`,
  );

  // Trần đếm trên SỐ DÒNG THỰC SỰ MỚI (đã trừ đơn có sẵn), không phải cả bốn mã
  // — chạy lại sau khi đã ghi thì `rows` rỗng và không vướng trần.
  if (alreadyRewarded + rows.length > REWARDED_REFERRALS_MAX) {
    throw new Error(
      `Vượt trần: ${alreadyRewarded} + ${rows.length} > ${REWARDED_REFERRALS_MAX}. Dừng.`,
    );
  }

  if (!commit) {
    console.log("\n(Chạy thử — chưa ghi. Thêm --commit để ghi sổ.)");
    return;
  }
  if (rows.length === 0) {
    console.log("\nKhông có gì để ghi — mọi đơn đã có dòng commission.");
    return;
  }

  const written = await prisma.referralLedger.createMany({
    data: rows,
    skipDuplicates: true,
  });
  console.log(`\nĐã ghi: ${written.count} dòng.`);

  const balanceAfter = await creditBalanceVnd(prisma, REFERRER_ID, new Date());
  const pendingAfter = await pendingCreditVnd(prisma, REFERRER_ID, new Date());
  console.log(
    `Số dư mới: ${vnd(balanceAfter)} (đang giữ: ${vnd(pendingAfter)})`,
  );
}

main()
  .catch((error) => {
    console.error("Lỗi:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
