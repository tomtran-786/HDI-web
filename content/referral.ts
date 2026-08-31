import {
  REFERRAL_COMMISSION_PCT,
  REFERRAL_DISCOUNT_PCT,
} from "@/lib/referral-pricing";

/**
 * Trang giới thiệu bạn bè trong khu vực tài khoản.
 *
 * Hai con số phần trăm đọc thẳng từ `lib/referral-pricing.ts` chứ không viết
 * tay: chúng là điều khoản của một chương trình có tiền thật, và một lần đổi
 * chính sách mà quên sửa trang này là HDI hứa một đằng, trừ tiền một nẻo.
 */
export const referralPage = {
  eyebrow: "Khu vực học viên",
  title: "Giới thiệu bạn bè",
  subtitle: `Bạn của bạn được giảm ${REFERRAL_DISCOUNT_PCT}% cho đơn đầu tiên, và bạn nhận ${REFERRAL_COMMISSION_PCT}% credits trên số tiền họ thanh toán.`,

  codeLabel: "Mã giới thiệu của bạn",
  linkLabel: "Link mời",
  copy: "Sao chép",
  copied: "Đã sao chép",

  /** Mã cấp lười, nên có một khoảnh khắc rất ngắn mà nó chưa tồn tại. */
  codeUnavailable:
    "Chưa cấp được mã giới thiệu lúc này. Vui lòng tải lại trang sau ít phút.",

  balanceLabel: "Số dư credits",
  balanceHint:
    "Credits được trừ vào đơn mua sau, khi bạn bật ô “Dùng credits giới thiệu” trong giỏ hàng. Đơn luôn giữ lại một khoản nhỏ phải thanh toán qua PayOS.",

  referredLabel: "Bạn bè đã đăng ký",
  referredEmpty: "Chưa có ai đăng ký bằng mã của bạn.",
  referredCount: (n: number) => `${n} tài khoản đã xác thực email`,

  historyTitle: "Lịch sử credits",
  historyEmpty:
    "Chưa có khoản nào. Credits xuất hiện ở đây ngay khi người bạn giới thiệu thanh toán đơn đầu tiên.",

  entryType: {
    commission: "Hoa hồng giới thiệu",
    redemption: "Trừ vào đơn hàng",
    adjustment: "Điều chỉnh",
  } as Record<string, string>,

  /** `reserved` đã trừ vào số dư rồi, nên phải nói ra kẻo người dùng cộng lại sai. */
  entryStatus: {
    posted: "",
    reserved: "đang giữ chỗ",
    applied: "đã dùng",
    void: "đã hoàn lại",
  } as Record<string, string>,

  rules: [
    `Ưu đãi áp dụng MỘT lần cho mỗi tài khoản, ở lần thanh toán đầu tiên của người được giới thiệu.`,
    `Mã phải được nhập ngay lúc đăng ký tài khoản — không gắn lại được về sau.`,
    `Credits cộng trên số tiền thực thu, tức đã trừ ưu đãi nhóm và khoản giảm ${REFERRAL_DISCOUNT_PCT}% của đơn đó.`,
    "Credits không quy đổi thành tiền mặt; chúng được trừ vào học phí các đơn sau.",
  ],
  rulesTitle: "Điều khoản",
  backToAccount: "Trang tài khoản",
  /** Nhãn nút dẫn tới trang này, đặt cạnh nút "Đơn hàng" ở /tai-khoan. */
  accountCta: "Giới thiệu bạn bè",
} as const;
