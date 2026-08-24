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
      "Học phí đã được xác nhận. HDI đang cấp quyền Google Drive; link vào lớp và trạng thái record nằm trong trang tài khoản.",
  },
  closed: {
    cancelled: "Đơn này đã hủy. Chỗ học đã được trả lại.",
    expired:
      "Đơn này đã quá hạn giữ chỗ và tự đóng. Bạn có thể đặt lại nếu khóa học vẫn còn chỗ.",
    refunded: "Đơn này đã được hoàn tiền.",
  },
} as const;

export const paymentResultPage = {
  pollingHint: "Đang tự động kiểm tra xác nhận từ PayOS…",
  pollingExhausted:
    "Vẫn chưa nhận được xác nhận. PayOS đôi khi mất vài phút để gửi webhook — bấm kiểm tra lại, hoặc liên hệ Zalo/email nếu bạn chắc đã thanh toán.",
  retryLabel: "Kiểm tra lại",
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
