/**
 * Copy for the cart modal and order pages.
 *
 * Nothing here states a fact about the world that HDI has not supplied. In
 * Payment copy points students to the hosted PayOS link and never publishes
 * bank details or treats return-page query parameters as proof of payment.
 */

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
 * Dòng mời (`invite`) luôn hiển thị chứ không nằm sau một nút "xem thêm": ưu đãi
 * mà người mua không nhìn thấy trước khi bấm thanh toán thì không phải ưu đãi.
 */
export const groupPanel = {
  invite: "Học cùng nhóm từ 03 bạn — tiết kiệm tới 10%",
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
   * Nói ngay khi phần dư không tiêu hết được, thay vì để người mua tự hỏi vì
   * sao số dư còn mà đơn vẫn phải trả tiền.
   */
  remainderNote:
    "Đơn luôn giữ lại một khoản nhỏ phải thanh toán qua PayOS, nên số dư còn lại được giữ cho lần mua sau.",
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
      "Chỗ học đang được giữ trong 2 giờ. Hoàn tất trên PayOS; HDI chỉ xác nhận khi nhận được webhook có chữ ký hợp lệ.",
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
  backToOrder: (code: number) => `Quay lại đơn #${code}`,
} as const;

export const paymentResultPage = {
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
