/**
 * Chữ của band "Điều bạn nhận được" ở cuối trang chi tiết khóa
 * (components/course-expect-band.tsx). Câu chung cho cả bảy khóa; phần riêng
 * của từng khóa — ba kết quả đầu trong "Sau khóa học, bạn có thể" — đọc thẳng
 * từ `course.outcomes`, nên không cần field mới.
 *
 * CHỜ CHỦ SITE DUYỆT: câu tiêu đề và nhãn nút bên dưới là đề xuất.
 */
export const courseExpect = {
  eyebrow: "Điều bạn nhận được",
  title: "Đưa nghiên cứu của bạn từ mơ hồ đến bài bản",
  /** Cụm trong `title` được gạch chân tay. */
  mark: "bài bản",
  /** Nhãn nút khi khóa đang nhận đăng ký / khi chưa mở. */
  cta: { open: "Giữ chỗ khóa này", closed: "Xem học phí và lịch học" },
  /** Số kết quả hiện trên tờ giấy trên cùng của "chồng bản thảo". */
  outcomeCount: 3,
  deckLabel: "Ba kết quả đầu tiên bạn đạt được sau khóa học",
} as const;
