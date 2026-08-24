import type { FeedbackKindInput } from "@/lib/feedback-input";

export const feedbackCopy = {
  bubble: "Góp ý",
  bubbleAria: "Báo lỗi hoặc góp ý cho HDI",
  eyebrow: "Góp ý với HDI",
  title: "Báo lỗi hoặc góp ý",
  intro: "Chia sẻ điều chưa ổn hoặc một ý tưởng để HDI phục vụ bạn tốt hơn.",
  close: "Đóng hộp góp ý",
  signedOut:
    "Bạn cần đăng nhập để gửi góp ý. HDI sẽ dùng email trong tài khoản để xác nhận đã nhận và báo lại khi xử lý xong.",
  signIn: "Đăng nhập để gửi",
  kind: "Loại",
  titleLabel: "Tiêu đề",
  titlePlaceholder: "Tóm tắt điều bạn muốn HDI biết",
  bodyLabel: "Mô tả",
  bodyPlaceholder: "Mô tả chi tiết điều đã xảy ra hoặc ý tưởng của bạn…",
  compose: "Soạn thảo",
  preview: "Xem trước",
  markdownSupport: "Hỗ trợ Markdown",
  emptyPreview: "Nội dung xem trước sẽ hiện ở đây.",
  characterCount: "ký tự",
  cancel: "Huỷ",
  submit: "Gửi",
  submitting: "Đang gửi…",
  successTitle: "HDI đã nhận được góp ý",
  successBody:
    "Cảm ơn bạn đã dành thời gian. HDI đã gửi email xác nhận và sẽ báo lại nếu góp ý được đánh dấu đã xử lý.",
  done: "Đóng",
  validation: {
    signedOut: "Bạn cần đăng nhập để gửi feedback.",
    kind: "Vui lòng chọn Báo lỗi hoặc Góp ý.",
    title: "Vui lòng nhập tiêu đề.",
    body: "Vui lòng nhập mô tả.",
    throttle: "Bạn vừa gửi quá nhiều lần. Vui lòng thử lại sau ít phút.",
  },
} as const;

export const feedbackKindLabel: Record<FeedbackKindInput, string> = {
  bug: "Báo lỗi",
  idea: "Góp ý",
};

export const feedbackStatusLabel: Record<string, string> = {
  open: "Chờ xử lý",
  resolved: "Đã xử lý",
  dismissed: "Đã bỏ qua",
};

export const feedbackStatusTone: Record<
  string,
  "cool" | "success" | "warning" | "danger"
> = {
  open: "warning",
  resolved: "success",
  dismissed: "cool",
};
