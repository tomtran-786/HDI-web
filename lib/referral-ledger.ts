import { prisma } from "./prisma";
import type { ReferralDb } from "./referral-code";
import {
  COMMISSION_HOLD_DAYS,
  CREDIT_TTL_MONTHS,
  REFERRAL_COMMISSION_PCT,
  REWARDED_REFERRALS_MAX,
  commissionAvailableAt,
  commissionExpiresAt,
  referralCommissionVnd,
  rewardWindowStart,
} from "./referral-pricing";

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
  now: Date = new Date(),
): Promise<number> {
  const total = await db.referralLedger.aggregate({
    where: { userId, ...availableAt(now) },
    _sum: { amountVnd: true },
  });
  return total._sum.amountVnd ?? 0;
}

/**
 * Vị từ "đã có hiệu lực" dùng chung cho mọi phép cộng số dư.
 *
 * Viết một lần ở đây chứ không lặp lại ở từng chỗ: đây là công thức số dư, và
 * một bản sao lệch điều kiện là một số dư thứ hai.
 *
 * Hàng `redemption` để `availableAt` trống nên luôn lọt qua — một khoản đã tiêu
 * biến mất khỏi số dư đúng bằng việc trả lại tiền cho người đã tiêu nó.
 */
function availableAt(now: Date) {
  return {
    status: { not: "void" as const },
    OR: [{ availableAt: null }, { availableAt: { lte: now } }],
  };
}

/**
 * Phần credits đã ghi nhưng còn trong thời gian giữ, CHỈ để hiển thị.
 *
 * Người giới thiệu cần thấy khoản của mình đang nằm đâu; không hiện thì trang
 * tài khoản im lặng suốt bảy ngày sau khi bạn họ thanh toán, và họ tưởng hệ
 * thống quên.
 */
export async function pendingCreditVnd(
  db: ReferralDb,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const total = await db.referralLedger.aggregate({
    where: { userId, status: { not: "void" }, availableAt: { gt: now } },
    _sum: { amountVnd: true },
  });
  return total._sum.amountVnd ?? 0;
}

/**
 * Số lượt giới thiệu ĐÃ ĐƯỢC THƯỞNG trong cửa sổ trượt sáu tháng.
 *
 * Đếm cả khoản đang giữ và khoản đã hết hạn: chính sách giới hạn số LƯỢT được
 * thưởng, không giới hạn số credits đang còn dùng được.
 */
export async function rewardedReferralsInWindow(
  db: ReferralDb,
  userId: string,
  now: Date,
): Promise<number> {
  return db.referralLedger.count({
    where: {
      userId,
      type: "commission",
      status: { not: "void" },
      createdAt: { gte: rewardWindowStart(now) },
    },
  });
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
  /** Nằm im tới mốc này, tức hết thời hạn hoàn phí. */
  availableAt: Date;
  /** Hết hạn sau sáu tháng nếu chưa tiêu. */
  expiresAt: Date;
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
 *
 * LUẬT THỨ TƯ, thêm ngày 2026-09-01: tối đa `REWARDED_REFERRALS_MAX` lượt được
 * thưởng trong cửa sổ trượt sáu tháng. Đây là giới hạn DUY NHẤT của chương
 * trình mà database không đỡ được: nó cần đếm nhiều hàng tại thời điểm ghi, thứ
 * không diễn đạt được bằng partial unique index như ba luật kia. Vì vậy nó phải
 * được kiểm ở đây, và nơi gọi có trách nhiệm đếm bên trong cùng transaction.
 * Từ lượt thứ sáu, chính sách nói HDI có thể tặng tài liệu hoặc workshop thay
 * cho credits — đó là việc tay, không phải một dòng sổ.
 */
export function buildCommissionRow(input: {
  referrerId: string | null | undefined;
  payerUserId: string;
  orderId: string;
  basisVnd: number;
  now: Date;
  rewardedInWindow: number;
}): CommissionRow | null {
  const { referrerId, payerUserId, orderId, basisVnd, now } = input;
  if (!referrerId) return null;
  if (input.rewardedInWindow >= REWARDED_REFERRALS_MAX) return null;
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
    note: `Hoa hồng ${REFERRAL_COMMISSION_PCT}% từ đơn đầu tiên của người bạn giới thiệu · dùng được sau ${COMMISSION_HOLD_DAYS} ngày, hạn ${CREDIT_TTL_MONTHS} tháng`,
    availableAt: commissionAvailableAt(now),
    expiresAt: commissionExpiresAt(now),
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
    now: Date;
  },
): Promise<CommissionRow | null> {
  // Đếm TRƯỚC khi dựng hàng, và bên trong transaction của nơi gọi: trần "5 lượt
  // trong 6 tháng" không có index nào đỡ, nên hai webhook về cùng lúc mà đọc số
  // đếm ngoài transaction sẽ cùng thấy 4 và cùng ghi.
  const rewardedInWindow = input.referrerId
    ? await rewardedReferralsInWindow(db, input.referrerId, input.now)
    : 0;
  const row = buildCommissionRow({ ...input, rewardedInWindow });
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

/**
 * Xóa sổ phần credits đã quá hạn sáu tháng mà chưa tiêu, gọi từ cron hằng ngày.
 *
 * VÌ SAO KHÔNG TRỪ THẲNG khoản quá hạn ra khỏi số dư: sổ này không gắn khoản
 * chi với khoản thu nào. Một người nhận 100.000 hồi tháng Ba và đã tiêu hết nó
 * hồi tháng Tư vẫn còn nguyên hàng `commission` tháng Ba trong sổ; lọc hàng đó
 * khỏi công thức số dư là trừ họ thêm một lần nữa số tiền họ đã tiêu.
 *
 * Thay vào đó, mỗi lần chạy ghi một hàng `expiry` âm bằng đúng phần chưa tiêu,
 * và số dư vẫn là MỘT phép cộng như cũ. Phần chưa tiêu tính bằng ba tổng, với
 * giả định tiêu FIFO — khoản cũ tiêu trước, đúng cách một người tiêu ví của
 * chính mình:
 *
 *   E  tổng hoa hồng đã tới hạn
 *   S  tổng đã tiêu (redemption chưa `void`, cả `reserved` lẫn `applied`)
 *   W  tổng đã xóa sổ ở những lần chạy trước
 *
 *   writeOff = clamp(E − S − W, 0, số dư hiện tại)
 *
 * Công thức tự sửa: chạy lại trong cùng một ngày ra 0, và một lần chạy bị bỏ lỡ
 * được bù ở lần sau chứ không mất. Kẹp theo số dư hiện tại để một khoản đang
 * giữ chỗ cho đơn chưa thanh toán không đẩy số dư xuống âm.
 */
export async function expireCredits(now: Date = new Date()) {
  const owners = await prisma.referralLedger.findMany({
    where: {
      type: "commission",
      status: { not: "void" },
      expiresAt: { lte: now },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  let written = 0;
  let totalVnd = 0;

  for (const { userId } of owners) {
    // Một transaction cho mỗi người: khóa hàng user trước, vì `createOrder`
    // đang đọc chính số dư này để quyết định trừ bao nhiêu credits.
    const amount = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "users" WHERE id = ${userId} FOR UPDATE`;

      const [matured, spent, writtenOff, balance] = await Promise.all([
        tx.referralLedger.aggregate({
          where: {
            userId,
            type: "commission",
            status: { not: "void" },
            expiresAt: { lte: now },
          },
          _sum: { amountVnd: true },
        }),
        tx.referralLedger.aggregate({
          where: { userId, type: "redemption", status: { not: "void" } },
          _sum: { amountVnd: true },
        }),
        tx.referralLedger.aggregate({
          where: { userId, type: "expiry" },
          _sum: { amountVnd: true },
        }),
        creditBalanceVnd(tx, userId, now),
      ]);

      const E = matured._sum.amountVnd ?? 0;
      // Hai tổng này đã mang dấu âm sẵn trong sổ.
      const S = Math.abs(spent._sum.amountVnd ?? 0);
      const W = Math.abs(writtenOff._sum.amountVnd ?? 0);

      const writeOff = Math.max(0, Math.min(E - S - W, balance));
      if (writeOff <= 0) return 0;

      await tx.referralLedger.create({
        data: {
          userId,
          type: "expiry",
          status: "posted",
          amountVnd: -writeOff,
          note: `Credits hết hạn sau ${CREDIT_TTL_MONTHS} tháng`,
          settledAt: now,
        },
      });
      return writeOff;
    });

    if (amount > 0) {
      written += 1;
      totalVnd += amount;
    }
  }

  return { users: written, totalVnd };
}
