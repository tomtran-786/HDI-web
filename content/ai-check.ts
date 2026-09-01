/**
 * Dịch vụ kiểm tra AI & đạo văn — bảng giá và toàn bộ chữ của trang
 * /kiem-tra-ai-dao-van.
 *
 * NGUỒN: bảng giá do HDI cung cấp, cập nhật ngày 2026-09-01 — chép nguyên văn
 * ba bậc và chín mức giá. Không có mức nào được nội suy, làm tròn hay suy ra từ
 * mức khác. Ranh giới bậc ghi theo trang; quy đổi sang từ theo tỷ lệ 250 từ/
 * trang mà bảng đang dùng (40 trang = 10.000 từ ⇒ 20 trang = 5.000 từ).
 *
 * Bảng giá là DỮ LIỆU chứ không phải JSX vì đúng những con số này còn được
 * server dùng lại để tính số tiền gửi sang PayOS (lib/ai-check-pricing.ts).
 * Giá trên màn hình và giá trong đơn hàng phải đến từ một nguồn duy nhất —
 * nếu chép sang chỗ thứ hai thì một lần sửa giá sẽ chỉ sửa được một nửa.
 */

export const aiCheckKinds = [
  { id: "ai", label: "Check AI" },
  { id: "plagiarism", label: "Check đạo văn" },
  { id: "combo", label: "Combo Check AI + Đạo văn" },
] as const;

export type AiCheckKind = (typeof aiCheckKinds)[number]["id"];

/** Nhãn tiếng Việt của một loại dịch vụ, trả lại chính mã nếu bảng giá đã đổi. */
export function serviceKindLabel(kind: string) {
  return aiCheckKinds.find((item) => item.id === kind)?.label ?? kind;
}

export const aiCheckTiers = [
  {
    id: "duoi-20-trang",
    label: "Dưới 20 trang",
    words: "≤ 5.000 từ",
    // Đúng 5.000 từ thuộc bậc này: bảng ghi "≤ 5.000 từ", còn bậc sau mở bằng
    // "5.000 – 10.000". Chỗ chồng lấn đó được xử theo dấu "≤", tức là theo mức
    // có lợi cho học viên.
    maxWords: 5_000,
    prices: { ai: 20_000, plagiarism: 15_000, combo: 35_000 },
  },
  {
    id: "duoi-40-trang",
    label: "Từ 20 đến 40 trang",
    words: "5.000 – 10.000 từ",
    // Cùng cách xử dấu "≤" ở ranh giới 10.000 từ: đúng 10.000 từ vẫn thuộc bậc
    // này chứ không rơi sang bậc trên.
    maxWords: 10_000,
    prices: { ai: 35_000, plagiarism: 25_000, combo: 50_000 },
  },
  {
    id: "tren-40-trang",
    label: "Trên 40 trang",
    words: "10.000 – 29.000 từ",
    maxWords: 29_000,
    prices: { ai: 50_000, plagiarism: 35_000, combo: 70_000 },
  },
] as const;

export type AiCheckTier = (typeof aiCheckTiers)[number];
export type AiCheckTierId = AiCheckTier["id"];

/**
 * Trần của bảng giá, lấy từ bậc cuối chứ không viết tay lại: bảng giá chỉ có
 * hai bậc và dừng ở 29.000 từ, nên bài dài hơn không có giá để báo. Trang sẽ
 * chuyển sang mời liên hệ thay vì đoán một con số.
 */
export const WORD_LIMIT = aiCheckTiers[aiCheckTiers.length - 1].maxWords;

/** Bậc giá thấp nhất, để hero mời "chỉ từ …" mà không chép lại số. */
export const aiCheckFromPrices = aiCheckTiers[0].prices;

export const aiCheck = {
  eyebrow: "Dịch vụ",
  title: "Kiểm tra AI & đạo văn",
  subtitle:
    "Nhập số từ của bản thảo để biết ngay chi phí, thanh toán trực tuyến rồi gửi bài qua Zalo.",
  intro:
    "Bản thảo được kiểm tra tỷ lệ nội dung do AI sinh và tỷ lệ trùng lặp, trả về báo cáo để bạn chỉnh sửa trước khi nộp hoặc gửi đăng. Giá tính theo độ dài bản thảo, không tính theo số lần kiểm tra lại.",
  tableTitle: "Bảng giá",
  formTitle: "Tính chi phí cho bản thảo của bạn",
  wordLabel: "Số từ của bản thảo",
  wordHint: "Đếm bằng Word: Review → Word Count. Không tính phụ lục và tài liệu tham khảo.",
  kindLabel: "Chọn dịch vụ",
  amountLabel: "Chi phí",
  payLabel: "Thanh toán",
  paying: "Đang kết nối PayOS…",
  tooLongTitle: "Bản thảo dài hơn bảng giá",
  tooLongBody:
    "Bảng giá dừng ở 29.000 từ. Bản thảo dài hơn được báo giá riêng — nhắn Zalo kèm số từ, HDI trả lời trong ngày.",
  emptyHint: "Nhập số từ để xem chi phí.",
  invalidWords: "Số từ phải là một số nguyên lớn hơn 0.",
  // Zalo không nhận sẵn nội dung tin nhắn qua deep link, nên mã đơn phải được
  // học viên tự mang sang. Chữ ở trang kết quả nói đúng điều đó.
  result: {
    eyebrow: "Đơn dịch vụ",
    pendingTitle: "Đơn đã tạo, đang chờ thanh toán",
    pendingBody:
      "Nếu bạn đã chuyển khoản, trạng thái sẽ đổi trong ít phút sau khi ngân hàng báo về. Bạn có thể gửi bài trước.",
    cancelledTitle: "Bạn đã rời trang thanh toán",
    cancelledBody:
      "Đơn vẫn được giữ trong thời hạn hiển thị bên dưới. Bạn có thể mở lại PayOS để tiếp tục, hoặc quay lại tạo đơn khác.",
    paidTitle: "Đã nhận thanh toán",
    paidBody: "Gửi bản thảo qua Zalo kèm mã đơn bên dưới để HDI bắt đầu kiểm tra.",
    closedTitle: "Đơn này đã đóng",
    closedBody:
      "Đơn quá hạn hoặc đã hủy. Bạn có thể tạo lại đơn mới với cùng số từ.",
    codeLabel: "Mã đơn",
    copy: "Sao chép mã",
    copied: "Đã sao chép",
    sendTitle: "Gửi bài qua Zalo",
    sendBody:
      "Nhắn cho HDI kèm mã đơn ở trên và đính kèm file bản thảo (.doc/.docx/.pdf).",
    sendCta: "Mở Zalo để gửi bài",
    back: "Tạo đơn khác",
  },
} as const;
