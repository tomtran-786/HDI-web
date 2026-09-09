/**
 * Chữ cho ô đánh giá khóa học trong khu vực học viên.
 *
 * Trước đây form đánh giá hiện thẳng trong mỗi thẻ khóa; giờ nó nằm sau một nút,
 * bấm mới mở modal — nên có thêm nhãn nút và nhãn đóng.
 */
export const review = {
  rateCta: "Đánh giá khóa học",
  editCta: "Sửa đánh giá",
  dialogTitle: "Đánh giá khóa học",
  ratingLegend: "Số sao",
  commentLabel: "Nhận xét về khóa học",
  commentPlaceholder: "Khóa học giúp bạn được điều gì? (không bắt buộc)",
  publicNotice:
    "Đánh giá sẽ hiện công khai trên trang khóa học kèm tên tài khoản của bạn, sau khi được HDI duyệt.",
  submit: "Gửi đánh giá",
  update: "Cập nhật đánh giá",
  submitting: "Đang gửi…",
  cancel: "Hủy",
  close: "Đóng",
  saved: "Đã gửi. Đánh giá sẽ hiện trên trang khóa học sau khi được duyệt.",
  /** Nhãn ngắn cạnh nút, cho biết trạng thái bản đánh giá đã gửi trước đó. */
  statusHint: {
    pending: "Đang chờ duyệt",
    published: "Đang hiển thị công khai",
    rejected: "Chưa được đăng — có thể viết lại",
  },
} as const;
