import {
  COMMISSION_HOLD_DAYS,
  CREDIT_MAX_SHARE_PCT,
  CREDIT_TTL_MONTHS,
  REFERRAL_COMMISSION_PCT,
  REFERRAL_DISCOUNT_PCT,
  REWARDED_REFERRALS_MAX,
  REWARD_WINDOW_MONTHS,
} from "@/lib/referral-pricing";

/**
 * Trang giới thiệu bạn bè trong khu vực tài khoản.
 *
 * MỌI con số ở đây đọc thẳng từ `lib/referral-pricing.ts` chứ không viết tay:
 * chúng là điều khoản của một chương trình có tiền thật, và một lần đổi chính
 * sách mà quên sửa trang này là HDI hứa một đằng, trừ tiền một nẻo.
 *
 * Ba nhóm điều khoản dưới đây là bản chủ dự án chốt ngày 2026-09-01. Mỗi dòng
 * trong `rules` phải có một chỗ thực thi tương ứng trong code — nếu một luật
 * chưa được thực thi thì nó không được đứng ở đây.
 */
export const referralPage = {
  eyebrow: "Khu vực học viên",
  title: "Giới thiệu bạn bè",
  subtitle: `Bạn của bạn được giảm ${REFERRAL_DISCOUNT_PCT}% cho khóa học đầu tiên, và bạn nhận ${REFERRAL_COMMISSION_PCT}% học phí họ đã đóng dưới dạng credits.`,

  howItWorksTitle: "Cách hoạt động",
  howItWorks: [
    {
      text: "Chia sẻ mã hoặc link mời của bạn",
      detail:
        "Link mời đã kèm sẵn mã, người nhận chỉ việc bấm vào là ô mã được điền giúp.",
    },
    {
      text: "Bạn của bạn nhập mã — lúc đăng ký, hoặc ở giỏ hàng",
      detail:
        "Nhập ngay lúc đăng ký tài khoản là chắc chắn nhất. Lỡ đăng ký rồi mà chưa kịp điền thì vẫn còn một ô nữa ở giỏ hàng, dùng được cho tới trước lần thanh toán đầu tiên.",
    },
    {
      text: `Họ được giảm ${REFERRAL_DISCOUNT_PCT}% cho khóa học đầu tiên`,
      detail:
        "Mã đã gắn rồi thì khoản giảm tự áp vào giỏ hàng ở lần thanh toán đầu tiên, không cần nhập thêm gì.",
    },
    {
      text: `Sau ${COMMISSION_HOLD_DAYS} ngày, credits vào ví của bạn`,
      detail:
        "Credits chờ hết thời hạn hoàn phí rồi mới dùng được, nên khoản thưởng luôn ứng với một khoản tiền đã ở lại.",
    },
    {
      text: `Bạn dùng credits cho khóa tiếp theo, tối đa ${CREDIT_MAX_SHARE_PCT}% học phí`,
      detail: `Bật ô “Dùng credits giới thiệu” trong giỏ hàng. Credits có hạn ${CREDIT_TTL_MONTHS} tháng kể từ ngày được cộng.`,
    },
  ],

  /** Khối minh họa chỉ đúng ô nhập mã trên form đăng ký. */
  guideTitle: "Bạn của bạn nhập mã ở đâu",
  guideIntro:
    "Ô này nằm ở bước điền thông tin trong trang đăng ký tài khoản. Nhập mã tại đây, hoặc mở link mời để ô được điền sẵn.",
  /**
   * Đường thứ hai, thêm cùng ô mã ở giỏ hàng. Nói ra ngay dưới khối minh họa vì
   * đây là câu cứu được một lượt giới thiệu tưởng đã mất: người giới thiệu đọc
   * trang này chính là người sẽ bảo bạn mình "trễ rồi" nếu trang không nói.
   */
  guideFallback:
    "Bạn của bạn đã đăng ký xong mà quên điền? Vẫn kịp: ô mã còn xuất hiện ở giỏ hàng, chừng nào tài khoản đó chưa thanh toán đơn nào.",
  guideMarker: "TẠI ĐÂY",
  guideStepLabel: "Đăng ký tài khoản",

  codeLabel: "Mã giới thiệu của bạn",
  linkLabel: "Link mời",
  copy: "Sao chép",
  copied: "Đã sao chép",

  /** Mã cấp lười, nên có một khoảnh khắc rất ngắn mà nó chưa tồn tại. */
  codeUnavailable:
    "Chưa cấp được mã giới thiệu lúc này. Vui lòng tải lại trang sau ít phút.",

  balanceLabel: "Credits khả dụng",
  balanceHint: `Trừ vào đơn mua sau khi bạn bật ô “Dùng credits giới thiệu” trong giỏ hàng, tối đa ${CREDIT_MAX_SHARE_PCT}% học phí mỗi lần đăng ký.`,

  pendingLabel: "Đang chờ",
  pendingHint: `Credits vừa ghi nhận, dùng được sau ${COMMISSION_HOLD_DAYS} ngày kể từ lúc bạn của bạn thanh toán.`,
  pendingEmpty: "Không có khoản nào đang chờ.",

  referredLabel: "Bạn bè đã đăng ký",
  referredEmpty: "Chưa có ai đăng ký bằng mã của bạn.",
  referredCount: (n: number) => `${n} tài khoản đã xác thực email`,

  rewardsLabel: "Lượt thưởng còn lại",
  rewardsValue: (left: number) => `${left}/${REWARDED_REFERRALS_MAX}`,
  rewardsHint: `Mỗi ${REWARD_WINDOW_MONTHS} tháng được thưởng credits tối đa ${REWARDED_REFERRALS_MAX} lượt giới thiệu.`,
  rewardsExhausted: `Bạn đã dùng hết ${REWARDED_REFERRALS_MAX} lượt thưởng của ${REWARD_WINDOW_MONTHS} tháng này. Vẫn giới thiệu được, và HDI có thể gửi tài liệu, workshop hoặc quyền xem lại recording thay cho credits — liên hệ HDI để nhận.`,

  historyTitle: "Lịch sử credits",
  historyEmpty:
    "Chưa có khoản nào. Credits xuất hiện ở đây ngay khi người bạn giới thiệu thanh toán đơn đầu tiên.",
  /** `date` đã được định dạng sẵn ở nơi gọi. */
  historyExpiresOn: (date: string) => `hạn dùng ${date}`,
  historyAvailableOn: (date: string) => `dùng được từ ${date}`,

  entryType: {
    commission: "Hoa hồng giới thiệu",
    redemption: "Trừ vào đơn hàng",
    adjustment: "Điều chỉnh",
    expiry: "Hết hạn",
  } as Record<string, string>,

  /** `reserved` đã trừ vào số dư rồi, nên phải nói ra kẻo người dùng cộng lại sai. */
  entryStatus: {
    posted: "",
    reserved: "đang giữ chỗ",
    applied: "đã dùng",
    void: "đã hoàn lại",
  } as Record<string, string>,

  rulesTitle: "Điều khoản",
  rules: [
    {
      title: "Người được giới thiệu",
      items: [
        `Được giảm ${REFERRAL_DISCOUNT_PCT}% cho khóa học đầu tiên đủ điều kiện.`,
        "Chỉ áp dụng cho học viên mới, ở lần thanh toán đầu tiên của tài khoản.",
        "Mỗi người chỉ được sử dụng một mã, nhập lúc đăng ký tài khoản hoặc ở giỏ hàng, và chỉ gắn được cho tới trước lần thanh toán đầu tiên.",
        "Không cộng dồn với giảm giá nhóm, early bird, học bổng hoặc mã khác.",
        "Nếu đồng thời đủ điều kiện nhiều ưu đãi, đơn hàng được áp mức ưu đãi cao nhất.",
      ],
    },
    {
      title: "Người giới thiệu",
      items: [
        `Nhận credits bằng ${REFERRAL_COMMISSION_PCT}% học phí thực tế của khóa học mà người được giới thiệu đăng ký.`,
        `Credits chỉ dùng được sau khi học viên mới thanh toán đầy đủ và qua ${COMMISSION_HOLD_DAYS} ngày hoàn phí.`,
        "Chỉ dùng được cho khóa học tiếp theo của chính người giới thiệu.",
        "Không quy đổi thành tiền mặt, không chuyển nhượng.",
        `Credits được dùng tối đa ${CREDIT_MAX_SHARE_PCT}% học phí của một lần đăng ký.`,
        `Credits có thời hạn ${CREDIT_TTL_MONTHS} tháng kể từ ngày được cộng.`,
        "Chỉ thưởng cho giới thiệu trực tiếp một tầng.",
      ],
    },
    {
      title: "Giới hạn",
      items: [
        `Tối đa ${REWARDED_REFERRALS_MAX} lượt giới thiệu được thưởng trong ${REWARD_WINDOW_MONTHS} tháng.`,
        `Với khóa 1.000.000 đ, tổng credits tối đa nhận được là 500.000 đ và tối đa dùng 300.000 đ cho một khóa cùng mức giá.`,
        `Từ lượt giới thiệu thứ ${REWARDED_REFERRALS_MAX + 1} trở đi, HDI có thể tặng tài liệu, workshop hoặc quyền truy cập recording thay vì tiếp tục phát credits.`,
      ],
    },
  ],

  backToAccount: "Trang tài khoản",
  /** Nhãn nút dẫn tới trang này, dùng cả ở /tai-khoan lẫn trên thanh điều hướng. */
  accountCta: "Giới thiệu bạn bè",
} as const;
