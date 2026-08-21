/**
 * Copy for the cart, the intake picker and the order pages.
 *
 * Nothing here states a fact about the world that HDI has not supplied. In
 * Payment copy points students to the hosted PayOS link and never publishes
 * bank details or treats return-page query parameters as proof of payment.
 */

export const enrolPage = {
  eyebrow: "Đăng ký",
  emptyTitle: "Chưa mở kỳ mới cho khóa này",
  emptyBody:
    "Các kỳ học được mở theo đợt. Để lại lời nhắn qua Zalo hoặc email, HDI sẽ báo bạn ngay khi có lịch khai giảng mới.",
  seatsLabel: "Chỗ còn lại",
  addLabel: "Thêm vào giỏ",
  addedLabel: "Đã có trong giỏ",
  enrolledLabel: "Bạn đã ghi danh kỳ này",
  fullLabel: "Đã hết chỗ",
  listedPriceNote:
    "Học phí hiển thị theo kỳ. Mức niêm yết trên trang khóa học có thể khác nếu HDI điều chỉnh giá cho kỳ này.",
} as const;

export const cartPage = {
  eyebrow: "Giỏ hàng",
  title: "Các kỳ học bạn chọn",
  empty: "Giỏ hàng đang trống.",
  emptyBody:
    "Chọn một khóa học, mở lộ trình và thêm kỳ bạn muốn tham gia vào giỏ.",
  browse: "Xem các khóa học",
  total: "Tổng cộng",
  checkout: "Đặt đơn và giữ chỗ",
  checkoutSignedOut: "Đăng nhập để đặt đơn",
  removeLabel: "Bỏ khỏi giỏ",
  droppedNotice:
    "Một số kỳ trong giỏ đã đóng đăng ký và được bỏ ra khỏi giỏ hàng.",
  blockedNotice:
    "Những kỳ được đánh dấu bên dưới sẽ không nằm trong đơn hàng.",
  holdNote:
    "Đặt đơn giữ chỗ trong 2 giờ và chuyển sang PayOS. Quyền record được cấp cho email đăng nhập, nên email đó cần thuộc một tài khoản Google.",
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
    hint: "Nếu đường dẫn chưa xuất hiện, PayOS có thể đang gián đoạn. Không tạo thêm đơn cho cùng kỳ học.",
  },
  paid: {
    title: "Đã thanh toán",
    body:
      "Học phí đã được xác nhận. HDI đang cấp quyền Google Drive; link vào lớp và trạng thái record nằm trong trang tài khoản.",
  },
  closed: {
    cancelled: "Đơn này đã hủy. Chỗ học đã được trả lại.",
    expired:
      "Đơn này đã quá hạn giữ chỗ và tự đóng. Bạn có thể đặt lại nếu kỳ học vẫn còn chỗ.",
    refunded: "Đơn này đã được hoàn tiền.",
  },
} as const;

export const orderStatusLabel: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  expired: "Quá hạn",
  refunded: "Đã hoàn tiền",
};
