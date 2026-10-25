import { referralPanel } from "@/content/checkout";
import { allowUserAction } from "./auth-throttle";
import { prisma } from "./prisma";

/** Số lần tra mã mỗi giờ cho một tài khoản — xem chú thích trong `resolveReferralCode`. */
const REFERRAL_CODE_LOOKUPS_PER_HOUR = 30;

export type ReferralFailure = "unknown" | "self" | "throttled";

export type ReferralResolution =
  | { ok: true; referrerId: string }
  | { ok: false; reason: ReferralFailure };

/**
 * Tra một mã giới thiệu đã được chuẩn hóa ra người giới thiệu.
 *
 * Một chỗ duy nhất cho hai đường vào: nút "Áp dụng" ở giỏ hàng
 * (app/api/gio-hang/ma-gioi-thieu/route.ts) và server action `checkout`, nơi mã
 * được kiểm lại lần nữa vì không bao giờ tin kết quả của lần trước.
 *
 * Cổng hạn mức `referral_code` RIÊNG và rộng hơn cổng `checkout`: gõ sai mã là
 * kiểu hỏng được dự liệu sẵn (bảng chữ cái của lib/referral-code.ts bỏ hẳn
 * `0 O 1 I L` vì mã được đọc qua điện thoại), còn cổng `checkout` tiêu một lượt
 * mỗi lần gọi và chỉ có mười lượt một giờ để bảo vệ khóa dòng courses và lượt
 * gọi PayOS. Dùng chung MỘT khóa `referral_code` cho cả hai đường vào để người
 * dò mã không nhân đôi hạn mức bằng cách xen kẽ giữa API và server action.
 *
 * Chỉ gọi sau khi đã có tài khoản hoàn chỉnh: không có tài khoản thì không tra
 * được mã nào.
 */
export async function resolveReferralCode(
  userId: string,
  code: string,
): Promise<ReferralResolution> {
  if (!(await allowUserAction("referral_code", userId, REFERRAL_CODE_LOOKUPS_PER_HOUR))) {
    return { ok: false, reason: "throttled" };
  }
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });
  if (!referrer) return { ok: false, reason: "unknown" };
  if (referrer.id === userId) return { ok: false, reason: "self" };
  return { ok: true, referrerId: referrer.id };
}

/** Câu báo lỗi cho người mua, theo lý do `resolveReferralCode` trả về. */
export function referralFailureMessage(reason: ReferralFailure): string {
  switch (reason) {
    case "unknown":
      return referralPanel.codeUnknownError;
    case "self":
      return referralPanel.codeSelfError;
    case "throttled":
      return referralPanel.codeThrottledError;
  }
}
