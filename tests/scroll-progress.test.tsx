import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  getScrollProgress,
  ScrollProgress,
} from "@/components/scroll-progress";

describe("thanh tiến độ cuộn", () => {
  it("render như một chỉ dấu thị giác không làm nhiễu trình đọc màn hình", () => {
    const html = renderToStaticMarkup(<ScrollProgress />);

    expect(html).toContain("data-scroll-progress");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="scroll-progress"');
  });

  it("tính đúng tỷ lệ trên toàn bộ phần có thể cuộn", () => {
    expect(getScrollProgress(0, 3_000, 1_000)).toBe(0);
    expect(getScrollProgress(1_000, 3_000, 1_000)).toBe(0.5);
    expect(getScrollProgress(2_000, 3_000, 1_000)).toBe(1);
  });

  it("clamp overscroll và giữ 0 khi trang không dài hơn viewport", () => {
    expect(getScrollProgress(-80, 3_000, 1_000)).toBe(0);
    expect(getScrollProgress(2_200, 3_000, 1_000)).toBe(1);
    expect(getScrollProgress(0, 900, 1_000)).toBe(0);
  });
});
