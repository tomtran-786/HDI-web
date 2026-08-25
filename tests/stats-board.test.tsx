import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { stats } from "@/content/stats";
import { StatsBoard } from "@/components/stats-board";

/**
 * Hiệu ứng chạy số chỉ là trang trí và chỉ sống trong trình duyệt. Điều phải
 * đúng ở mọi hoàn cảnh — HTML từ máy chủ, người tắt JavaScript, người bật
 * prefers-reduced-motion, hoặc IntersectionObserver không bao giờ báo — là con
 * số thật đã nằm sẵn trong markup chứ không phải số 0 chờ được chạy lên.
 */
describe("bảng số hồ sơ học thuật", () => {
  const html = renderToStaticMarkup(<StatsBoard />);

  it("render sẵn giá trị cuối cùng, không phải điểm xuất phát của hiệu ứng", () => {
    expect(html).toContain(">25+<");
    expect(html).toContain(">15+<");
    expect(html).toContain(">10+<");
    expect(html).not.toContain(">0+<");
  });

  it("nhóm hàng nghìn không phụ thuộc locale của máy chạy", () => {
    // toLocaleString trên máy chủ có thể cho "37.300" tùy locale, và một chuỗi
    // lệch với trình duyệt là lỗi hydrate — nên định dạng phải tự làm.
    expect(html).toContain("US$37,300");
  });

  it("mỗi ô có nhãn đọc được cho trình đọc màn hình", () => {
    // Một nhãn có "&", nên so trên bản đã giải mã thực thể thay vì trên markup thô.
    const text = html.replaceAll("&amp;", "&").replaceAll("&#x27;", "'");

    for (const stat of stats) {
      expect(text).toContain(stat.label);
    }
    expect(text).toContain("Tài trợ nghiên cứu: US$37,300");
    expect(text).toContain("Năm nghiên cứu & giảng dạy: 10+");
  });
});
