/**
 * Support services.
 * Source: the two sub-pages under /checking-ai-and-similarity-index-and-humanizing.
 * Both pages are title-only upstream, so these cards stay at a restatement of the
 * title plus a contact prompt — no service description is invented here.
 *
 * Kiểm tra AI & Đạo văn nay có bảng giá công khai (content/ai-check.ts, do HDI
 * cung cấp 2026-08-23) nên thẻ của nó dẫn sang trang đặt dịch vụ thay vì mời
 * hỏi giá. Humanizing vẫn chưa có giá niêm yết nên giữ nguyên nút email.
 */

export type ServiceItem = {
  title: string;
  titleEn: string;
  note: string;
  /**
   * Trang đặt dịch vụ, chỉ có ở dịch vụ đã niêm yết giá. Đường dẫn và nhãn đi
   * cùng nhau trong một object chứ không phải hai trường tùy chọn cạnh nhau:
   * một cái có mà cái kia thiếu là một cái nút không có chữ.
   */
  link?: { href: string; label: string };
};

export const services: {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: ServiceItem[];
} = {
  eyebrow: "Dịch vụ",
  title: "Dịch vụ hỗ trợ bản thảo",
  subtitle: "Hai dịch vụ đi kèm cho bản thảo trước khi gửi đăng",
  items: [
    {
      title: "Kiểm tra AI & Đạo văn",
      titleEn: "Checking AI & similarity index",
      note: "Bảng giá công khai theo độ dài bản thảo, từ 25.000đ. Nhập số từ để biết chi phí và thanh toán trực tuyến.",
      link: {
        href: "/kiem-tra-ai-dao-van",
        label: "Xem bảng giá & đặt dịch vụ",
      },
    },
    {
      title: "Humanizing and Proofreading",
      titleEn: "Humanizing and Proofreading",
      note: "Liên hệ để biết chi tiết và báo giá.",
    },
  ],
};
