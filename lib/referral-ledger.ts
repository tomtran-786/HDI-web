import { prisma } from "./prisma";
import type { ReferralDb } from "./referral-code";
import { REFERRAL_COMMISSION_PCT, referralCommissionVnd } from "./referral-pricing";

/**
 * Số dư credits của một người.
 *
 * MỘT công thức duy nhất, không ngoại lệ và không cột số dư nào ở đâu cả. Một
 * cột số dư là nguồn sự thật thứ hai cho cùng con số, và nó chỉ cần lệch đúng
 * một lần là không ai biết bên nào đúng nữa.
 *
 * `reserved` cố ý ĐƯỢC tính vào tổng: nó mang số âm và đã trừ vào số dư ngay từ
 * lúc ghi, nên hai lần checkout song song không tiêu được cùng một khoản.
 *
 * PHẢI đọc bên trong transaction đã khóa hàng user khi kết quả sắp được dùng để
 * ghi một khoản chi — Prisma chạy ở READ COMMITTED.
 */
export async function creditBalanceVnd(
  db: ReferralDb,
  userId: string,
): Promise<number> {
  const total = await db.referralLedger.aggregate({
    where: { userId, status: { not: "void" } },
    _sum: { amountVnd: true },
  });
  return total._sum.amountVnd ?? 0;
}

/**
 * Giữ chỗ credits cho một đơn vừa được tạo.
 *
 * Giữ NGAY tại lúc tạo đơn chứ không đợi tới lúc trả tiền: link PayOS sinh ra
 * với một số tiền cố định, nên khoản trừ phải được chốt trước khi link tồn tại.
 */
export async function reserveCredit(
  db: ReferralDb,
  input: { userId: string; orderId: string; amountVnd: number },
) {
  if (input.amountVnd <= 0) return;
  await db.referralLedger.create({
    data: {
      userId: input.userId,
      type: "redemption",
      status: "reserved",
      amountVnd: -input.amountVnd,
      orderId: input.orderId,
      note: "Giữ chỗ trừ credits cho lần thanh toán này",
    },
  });
}

/**
 * Trả credits về ví khi đơn chết.
 *
 * CHỈ chạm `reserved`. `applied` là một giao dịch đã thu tiền — void nó là tặng
 * khách khoản credits họ đã tiêu, và số dư sẽ phình ra mỗi lần ai đó hủy một
 * đơn cũ.
 */
export async function voidCreditReservation(
  db: ReferralDb,
  orderId: string,
  now: Date,
) {
  await db.referralLedger.updateMany({
    where: { orderId, type: "redemption", status: "reserved" },
    data: { status: "void", settledAt: now },
  });
}

/**
 * Đóng sổ khoản giữ chỗ khi tiền đã về.
 *
 * Về số học đây là no-op: `reserved` và `applied` đều được tính vào số dư. Nó
 * tồn tại để đối soát phân biệt được "đang giữ" với "đã tiêu thật".
 */
export async function settleCreditReservation(
  db: ReferralDb,
  orderId: string,
  now: Date,
) {
  await db.referralLedger.updateMany({
    where: { orderId, type: "redemption", status: "reserved" },
    data: { status: "applied", settledAt: now },
  });
}

export type CommissionRow = {
  userId: string;
  type: "commission";
  status: "posted";
  amountVnd: number;
  orderId: string;
  refereeUserId: string;
  ratePct: number;
  basisVnd: number;
  note: string;
};

/**
 * Dòng hoa hồng cho một đơn vừa được xác nhận, hoặc `null` nếu không có.
 *
 * Hàm thuần, cố ý không chạm database: nơi gọi quyết định transaction, và luật
 * tính tiền thì phải kiểm được mà không cần dựng cả một cái webhook.
 *
 * BA LUẬT, mỗi luật là một cách mất tiền đã từng xảy ra ở nơi khác:
 *
 *  1. Căn cứ là TIỀN THỰC THU của đơn — đã trừ ưu đãi nhóm và đã trừ khoản giảm
 *     10% của chính người mua. Trả hoa hồng trên giá niêm yết là trả trên số
 *     tiền chưa bao giờ về tài khoản.
 *  2. Credits KHÔNG bị trừ khỏi căn cứ. Credits là khoản thưởng đã ghi nợ từ
 *     trước, không phải một khoản giảm giá; trừ nữa là tính hai lần.
 *  3. Người hưởng là người giới thiệu của NGƯỜI TRẢ TIỀN, và chỉ ở đơn đầu
 *     tiên. Thành viên trong một đơn nhóm không tự sinh hoa hồng cho người giới
 *     thiệu của họ, vì họ không thanh toán gì cả.
 */
export function buildCommissionRow(input: {
  referrerId: string | null | undefined;
  payerUserId: string;
  orderId: string;
  basisVnd: number;
}): CommissionRow | null {
  const { referrerId, payerUserId, orderId, basisVnd } = input;
  if (!referrerId) return null;
  // Bất khả về mặt cấu trúc (chưa có tài khoản thì chưa biết mã của mình) và đã
  // có CHECK trong database, nhưng một dòng hoa hồng tự trả cho chính mình là
  // thứ không được phép lọt qua dù chỉ vì một lần sửa dữ liệu tay.
  if (referrerId === payerUserId) return null;

  const amountVnd = referralCommissionVnd(basisVnd);
  if (amountVnd <= 0) return null;

  return {
    userId: referrerId,
    type: "commission",
    status: "posted",
    amountVnd,
    orderId,
    refereeUserId: payerUserId,
    ratePct: REFERRAL_COMMISSION_PCT,
    basisVnd,
    note: `Hoa hồng ${REFERRAL_COMMISSION_PCT}% từ đơn đầu tiên của người bạn giới thiệu`,
  };
}

/**
 * Ghi hoa hồng cho một đơn vừa được xác nhận thanh toán.
 *
 * `skipDuplicates` sinh ra `ON CONFLICT DO NOTHING`, và nó tôn trọng cả hai
 * unique index có điều kiện trong migration. Nhờ vậy hai chuyện khác nhau cùng
 * được chặn ở tầng database, độc lập với mọi guard trong code:
 *
 *   - PayOS giao lại webhook  → va vào `referral_ledger_commission_order_key`
 *   - Đơn thứ hai của cùng người → va vào `referral_ledger_commission_referee_key`
 *
 * Chính index thứ hai là thứ hiện thực hóa luật "một lần cho mỗi tài khoản";
 * code phía trên không cần biết đơn này có phải đơn đầu tiên hay không.
 */
export async function accrueReferralCommission(
  db: ReferralDb,
  input: {
    referrerId: string | null | undefined;
    payerUserId: string;
    orderId: string;
    basisVnd: number;
  },
): Promise<CommissionRow | null> {
  const row = buildCommissionRow(input);
  if (!row) return null;
  await db.referralLedger.createMany({ data: [row], skipDuplicates: true });
  return row;
}

/**
 * Sửa các khoản giữ chỗ bị bỏ lửng, gọi từ cron hằng ngày.
 *
 * Đường hỏng: webhook commit thanh toán xong rồi chết trước khi đóng sổ (lambda
 * hết giờ là đủ). Đơn thành `paid` nhưng khoản giữ chỗ vẫn `reserved`, và đối
 * soát sẽ đọc nó là "đang giữ" mãi mãi.
 *
 * TUYỆT ĐỐI không void ở đây. Mọi đường hủy đơn đều đã đi qua
 * `voidCreditReservation`; nếu pass này cũng được void thì một lần đọc sai
 * trạng thái đơn sẽ hoàn credits cho một đơn đã thu tiền.
 */
export async function repairReferralReservations() {
  const now = new Date();
  const repaired = await prisma.referralLedger.updateMany({
    where: {
      type: "redemption",
      status: "reserved",
      order: { status: "paid" },
    },
    data: { status: "applied", settledAt: now },
  });
  return repaired.count;
}
