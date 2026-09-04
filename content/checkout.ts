/**
 * Copy for the cart modal and order pages.
 *
 * Nothing here states a fact about the world that HDI has not supplied. In
 * Payment copy points students to the hosted PayOS link and never publishes
 * bank details or treats return-page query parameters as proof of payment.
 */

import { REFERRAL_DISCOUNT_PCT } from "@/lib/referral-pricing";

export const cartModal = {
  eyebrow: "Đăng ký học",
  title: "Chọn khóa học",
  intro: "Chọn các khóa còn chỗ, kiểm tra tổng tiền rồi thanh toán một lần.",
  close: "Đóng giỏ hàng",
  loading: "Đang tải khóa học",
  loadError: "Chưa tải được khóa học. Vui lòng thử lại.",
  pruned:
    "Một số khóa không còn mở, đã hết chỗ hoặc không còn tồn tại nên được bỏ khỏi giỏ.",
  selected: "Đã chọn",
  empty: "Chọn ít nhất một khóa đang mở để thanh toán.",
  total: "Tổng cộng",
  /** `amount` là chênh lệch giữa tổng giá lẻ và số phải trả sau ưu đãi. */
  savings: (amount: string) => `Bạn tiết kiệm ${amount}`,
  /**
   * Nói trước khi rời trang: nút thanh toán redirect thẳng sang PayOS và giỏ
   * hàng bị dọn ngay lúc đó. Không có dòng này thì người mua bị chuyển đi mà
   * không biết mình vừa rời site.
   */
  payosHint: "Bạn sẽ được chuyển sang PayOS để thanh toán. Chỗ học được giữ 6 giờ.",
  openPendingOrder: (code: number) => `Mở đơn #${code} để hủy hoặc thanh toán tiếp.`,
  /**
   * Dải báo ở đầu giỏ khi người mua đang có đơn bỏ dở.
   *
   * Phải nói ra ngay cả khi giỏ trống: bấm Thanh toán là giỏ bị dọn sạch, nên
   * người quay lại từ PayOS thấy một giỏ rỗng và một khóa xám không chọn được,
   * không có gì nối hai chuyện đó với nhau.
   */
  pendingHold:
    "Bạn đang có đơn chờ thanh toán. Chỗ học đang được giữ cho đơn đó, nên khóa trong đơn tạm thời không chọn lại được.",
  /** Nhãn ngắn đặt ngay trên dòng khóa bị khóa, nơi không đủ chỗ cho một câu. */
  openPendingOrderShort: (code: number) => `Mở đơn #${code}`,
  paying: "Đang kết nối PayOS…",
  checkout: "Thanh toán",
  availability: {
    buyable: "Còn chỗ",
    not_open: "Chưa mở đăng ký",
    full: "Đã hết chỗ",
    pending: "Đang chờ thanh toán",
    already_enrolled: "Bạn đang có quyền truy cập",
  },
} as const;

/**
 * Ô mời và bảng nhập thành viên cho thanh toán nhóm.
 *
 * `invite` là nhãn của checkbox bật ưu đãi nhóm, luôn hiển thị ngay trong phần
 * tóm tắt chứ không nằm sau một nút "xem thêm": ưu đãi mà người mua không nhìn
 * thấy trước khi bấm thanh toán thì không phải ưu đãi. `dealBadge` đi kèm giá
 * nhóm in trên từng khóa trong danh sách để nói rõ giá đó có điều kiện.
 */
export const groupPanel = {
  invite: "Mua cùng nhóm từ 03 người — tiết kiệm tới 10%",
  dealBadge: "nhóm từ 03 bạn",
  title: "Thanh toán theo nhóm",
  intro:
    "Bạn thanh toán một lần cho cả nhóm. Mỗi bạn nhận quyền học liệu vào email của chính mình.",
  requirement:
    "Các bạn trong nhóm cần đã có tài khoản HDI và đã xác thực email.",
  inputLabel: "Email của bạn trong nhóm",
  placeholder: "ban@example.com",
  add: "Thêm",
  remove: "Bỏ khỏi nhóm",
  checking: "Đang kiểm tra…",
  unregistered: "Chưa có tài khoản đã xác thực",
  conflict: "Đã có quyền hoặc đơn chờ cho khóa trong giỏ",
  close: "Bỏ thanh toán nhóm",
  /**
   * Giỏ không còn khóa nào hưởng ưu đãi nhóm nên danh sách thành viên bị bỏ.
   *
   * Phải nói ra chứ không im lặng: bảng nhập biến mất cùng lúc, nên nếu không
   * có dòng này thì người mua chỉ thấy tổng tiền đột nhiên đổi.
   */
  dropped:
    "Giỏ hàng không còn khóa nào áp dụng ưu đãi nhóm, nên danh sách thành viên đã được bỏ. Chọn lại khóa có ưu đãi để mời nhóm.",
  listPrice: "Giá lẻ",
  perPerson: "mỗi người",
  /** `n` là số người còn thiếu để chạm bậc ưu đãi. */
  needMore: (n: number) => `Thêm ${n} bạn nữa để nhóm được giảm giá.`,
  size: (n: number) => `Nhóm ${n} người`,
  checkout: (n: number) => `Thanh toán cho ${n} người`,
} as const;

/**
 * Khối ưu đãi giới thiệu trong giỏ hàng.
 *
 * Hai khoản trừ được kể tên riêng chứ không gộp vào một con số "đã giảm": người
 * mua cần thấy vì sao mình trả ít hơn, và nhất là cần thấy credits của mình bị
 * tiêu đi bao nhiêu — đó là tiền của họ, không phải một khuyến mãi.
 */
export const referralPanel = {
  discountLine: "Giảm giới thiệu (đơn đầu tiên)",
  creditLine: "Trừ credits giới thiệu",
  subtotal: "Tạm tính",
  useCredit: "Dùng credits giới thiệu",
  balance: (amount: string) => `Số dư ${amount}`,
  /**
   * Ô nhập mã ở giỏ hàng, chỉ hiện cho người chưa có người giới thiệu và chưa
   * chốt đơn nào. Trước đây mã chỉ nhập được lúc đăng ký tài khoản, nên ai lỡ
   * đăng ký không kèm mã thì người giới thiệu mất phần vĩnh viễn.
   */
  codeLabel: "Mã giới thiệu (nếu có)",
  codePlaceholder: "Nhập mã",
  codeHint: `Nhập mã của người giới thiệu để được giảm ${REFERRAL_DISCOUNT_PCT}% cho khóa học đầu tiên của bạn.`,
  codeUnknownError:
    "Mã giới thiệu không tồn tại. Hãy kiểm tra lại mã bạn được gửi, hoặc bỏ trống ô đó để thanh toán không kèm mã.",
  codeSelfError: "Bạn không thể dùng mã giới thiệu của chính mình.",
  /**
   * Nói ngay khi phần dư không tiêu hết được, thay vì để người mua tự hỏi vì
   * sao số dư còn mà đơn vẫn phải trả tiền.
   */
  remainderNote:
    "Đơn luôn giữ lại một khoản nhỏ phải thanh toán qua PayOS, nên số dư còn lại được giữ cho lần mua sau.",
  /**
   * Ưu đãi không cộng dồn, nên khoản giảm giới thiệu có thể bị ưu đãi nhóm nuốt
   * mất. Không nói ra thì người mua tưởng mã của mình hỏng.
   */
  supersededByGroup:
    "Ưu đãi nhóm đang được áp dụng thay cho khoản giảm giới thiệu — các ưu đãi không cộng dồn, đơn luôn hưởng mức cao nhất.",
  /** `pct` là trần credits cho một lần đăng ký. */
  creditCapNote: (pct: number) =>
    `Credits chỉ được dùng tối đa ${pct}% học phí mỗi lần đăng ký, nên phần dư được giữ cho lần mua sau.`,
} as const;

export const orderPage = {
  eyebrow: "Đơn hàng",
  listTitle: "Đơn hàng của bạn",
  listEmpty: "Bạn chưa có đơn hàng nào.",
  codeLabel: "Mã đơn",
  holdUntil: "Giữ chỗ đến",
  cancel: "Hủy đơn",
  awaitingGateway: {
    title: "Chờ thanh toán qua PayOS",
    body:
      "Chỗ học đang được giữ trong 6 giờ. Hoàn tất trên PayOS; HDI chỉ xác nhận khi nhận được webhook có chữ ký hợp lệ.",
    hint: "Nếu đường dẫn chưa xuất hiện, PayOS có thể đang gián đoạn. Không tạo thêm đơn cho cùng khóa học.",
  },
  paid: {
    title: "Đã thanh toán",
    body:
      "Học phí đã được xác nhận. Link vào lớp hoặc nhóm học viên và trạng thái cấp quyền Google Drive nằm trong trang tài khoản.",
  },
  closed: {
    cancelled: "Đơn này đã hủy. Chỗ học đã được trả lại.",
    expired:
      "Đơn này đã quá hạn giữ chỗ và tự đóng. Bạn có thể đặt lại nếu khóa học vẫn còn chỗ.",
    refunded: "Đơn này đã được hoàn tiền.",
  },
} as const;

/**
 * Trang PayOS trả về khi học viên bấm "Hủy" giữa chừng.
 *
 * Có bốn kết cục khác hẳn nhau nên có bốn bộ chữ, và không bộ nào được nói thay
 * cho bộ khác: chỉ khi chỗ đã thực sự được trả thì trang mới được viết là đã
 * hủy. Nói "đã hủy" trong lúc PayOS vẫn đang giữ một link sống là cách chắc
 * chắn nhất để hai người cùng tin mình đang giữ một ghế.
 */
export const paymentCancelPage = {
  eyebrow: "PayOS",
  released: {
    title: "Đã hủy đơn và trả lại chỗ",
    subtitle:
      "Link thanh toán trên PayOS đã đóng. Bạn có thể đặt lại bất cứ lúc nào khóa học còn chỗ.",
  },
  confirm: {
    title: "Bạn đã rời trang thanh toán",
    subtitle:
      "Chỉ mở trang này không hủy đơn. Hãy xác nhận bên dưới để HDI kiểm tra và hủy link PayOS trước khi trả chỗ.",
  },
  closed: {
    title: "Đơn này không còn chờ thanh toán",
    subtitle:
      "Đơn đã được đóng trước đó, nên không còn chỗ nào bị giữ. Xem chi tiết trong trang đơn hàng.",
  },
  busy: {
    title: "Chưa thể tự hủy đơn này",
    payment_in_progress:
      "PayOS đang xử lý hoặc đã nhận tiền nên đơn chưa thể tự hủy. Nếu bạn đã chuyển khoản, hãy chờ vài phút để HDI nhận xác nhận.",
    gateway_unavailable:
      "Chưa liên hệ được PayOS nên đơn vẫn được giữ, để tránh hủy nhầm một khoản đang thanh toán. Bạn có thể thử lại bên dưới.",
  },
  throttled: {
    title: "Bạn vừa thao tác quá nhiều lần",
    subtitle:
      "Mỗi lần hủy là một lượt gọi sang PayOS nên số lượt mỗi giờ có giới hạn. Đơn vẫn đang được giữ nguyên; vui lòng thử lại sau ít phút trong trang đơn hàng.",
  },
  backToOrder: (code: number) => `Quay lại đơn #${code}`,
} as const;

/**
 * Banner khi HDI tự thu hồi một phiên thanh toán bị bỏ dở.
 *
 * Nói thẳng ba điều, vì đây là một việc HDI làm mà học viên không bấm: đơn nào,
 * chuyện gì đã xảy ra, và cách lấy lại lựa chọn cũ. Giỏ hàng đã bị dọn từ lúc
 * bàn giao sang PayOS, nên nếu không có nút "Đặt lại đơn" thì một lần thu hồi
 * nhầm — người dùng chỉ mở tab thứ hai trong lúc đang trả tiền — sẽ bắt họ chọn
 * lại từ đầu.
 */
export const checkoutReclaim = {
  title: (code: number) => `Đã hủy đơn #${code} và trả lại chỗ`,
  body:
    "Bạn đã rời trang thanh toán PayOS mà chưa hoàn tất, nên HDI đóng link và trả chỗ về cho khóa học. Không có khoản nào bị trừ.",
  restore: "Đặt lại đơn",
  dismiss: "Đóng",
} as const;

export const paymentResultPage = {
  /**
   * Trang quay lại của PayOS không chỉ có "đã trả" và "đang chờ". Học viên tới
   * đây với một đơn đã đóng cũng là chuyện thường: link hết hạn giữa chừng, hoặc
   * họ đã hủy ở một thiết bị khác. Nói đúng trạng thái đó thay vì hứa một xác
   * nhận sẽ không bao giờ tới.
   */
  closed: {
    title: "Đơn này đã đóng",
    cancelled:
      "Đơn đã được hủy và chỗ đã được trả lại. Bạn có thể đặt lại bất cứ lúc nào khóa học còn chỗ.",
    expired:
      "Link thanh toán đã hết hạn nên đơn tự đóng. Bạn có thể đặt lại nếu khóa học vẫn còn chỗ.",
    refunded: "Đơn này đã được hoàn tiền.",
  },
  pollingHint: "Đang tự động kiểm tra xác nhận từ PayOS…",
  pollingExhausted:
    "Vẫn chưa nhận được xác nhận. PayOS đôi khi mất vài phút để gửi webhook — bấm kiểm tra lại, hoặc liên hệ Zalo/email nếu bạn chắc đã thanh toán.",
  retryLabel: "Kiểm tra lại",
} as const;

/** Nhãn trên trang đơn hàng và trang tài khoản cho ghi danh mua theo nhóm. */
export const groupOrderLabel = {
  badge: "Thanh toán theo nhóm",
  paidForYou: "Được thanh toán giúp",
  learner: "Người học",
} as const;

export const orderStatusLabel: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  expired: "Quá hạn",
  refunded: "Đã hoàn tiền",
};

export const enrollmentStatusLabel: Record<string, string> = {
  pending: "Chờ xác nhận thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

/** Badge tone per order status, so "hết chỗ"/"đã hủy" reads differently from "đã thanh toán" at a glance. */
export const orderStatusTone: Record<
  string,
  "cool" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  paid: "success",
  cancelled: "danger",
  expired: "danger",
  refunded: "cool",
};
