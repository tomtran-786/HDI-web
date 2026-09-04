import { prisma } from "./prisma";
import { creditBalanceVnd } from "./referral-ledger";

export type ReferralQuote = {
  /** Người này còn quyền dùng khoản giảm 10% cho đơn đầu tiên hay không. */
  eligible: boolean;
  /**
   * Người này CHƯA có người giới thiệu và CHƯA có đơn nào chốt quyền ưu đãi —
   * tức giỏ hàng nên hiện ô nhập mã giới thiệu. Loại trừ lẫn nhau với `eligible`
   * theo đúng cách dựng: chưa gán thì thấy ô nhập mã, đã gán (đơn đầu) thì thấy
   * dòng giảm giá.
   */
  canEnterCode: boolean;
  /** Số dư credits, tính bằng đồng. */
  creditBalanceVnd: number;
};

/**
 * Trạng thái ưu đãi giới thiệu của một người, để giỏ hàng hiện đúng con số.
 *
 * ĐÂY LÀ BÁO GIÁ THỬ, KHÔNG PHẢI CĂN CỨ CỦA HÓA ĐƠN. `createOrder` đọc lại
 * đúng hai điều này bên trong transaction đã khóa hàng user rồi mới tính tiền;
 * hàm này chạy ngoài transaction và không khóa gì cả, nên hai kết quả có thể
 * lệch nhau nếu người dùng vừa trả một đơn ở tab khác. Chốt giá
 * `tongTienDuKien` trong `app/actions/checkout.ts` là thứ bắt được cái lệch đó
 * và mời người dùng xem lại giỏ, thay vì lặng lẽ tính một con số khác.
 *
 * Hai điều kiện dưới đây phải giống hệt `createOrder`, vì lệch nghĩa là mọi đơn
 * của người được giới thiệu đều bị hủy ngay sau khi tạo.
 */
export async function referralQuoteFor(userId: string): Promise<ReferralQuote> {
  const [user, claimed, balance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referredById: true },
    }),
    prisma.order.findFirst({
      where: {
        userId,
        OR: [
          { status: "paid" },
          { status: "pending", referralDiscountVnd: { gt: 0 } },
        ],
      },
      select: { id: true },
    }),
    creditBalanceVnd(prisma, userId),
  ]);

  return {
    eligible: user?.referredById != null && claimed === null,
    canEnterCode: user?.referredById == null && claimed === null,
    // Số dư âm là chuyện bất thường (một `adjustment` tay quá tay), nhưng đưa
    // số âm ra giỏ hàng thì chỉ làm người mua hoang mang.
    creditBalanceVnd: Math.max(0, balance),
  };
}
