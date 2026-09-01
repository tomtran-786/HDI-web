import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));

import {
  breadcrumbsForPathname,
  SiteBreadcrumbs,
} from "@/components/site-breadcrumbs";

beforeEach(() => {
  mocks.pathname = "/";
});

describe("breadcrumb toàn site", () => {
  it("ẩn trên homepage", () => {
    expect(renderToStaticMarkup(<SiteBreadcrumbs />)).toBe("");
  });

  it("hiện đủ ba cấp trên landing khóa học và link quay về hub", () => {
    mocks.pathname = "/khoa-hoc/nckh-chuyen-sau-spss";
    const html = renderToStaticMarkup(<SiteBreadcrumbs />);

    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/khoa-hoc"');
    expect(html).toContain("Phân tích định lượng với SPSS &amp; Stata");
    expect(html).toContain('aria-current="page"');
  });

  it("để route AI chuyên biệt đứng thẳng dưới trang chủ, không lồng dưới hub Dịch vụ", () => {
    expect(breadcrumbsForPathname("/kiem-tra-ai-dao-van")).toEqual([
      { label: "Trang chủ", href: "/" },
      { label: "Kiểm tra AI & Đạo văn" },
    ]);
  });

  it("không làm lộ mã đơn hoặc mã kết quả cá nhân", () => {
    const order = breadcrumbsForPathname("/tai-khoan/don-hang/HDI-SECRET-123");
    const result = breadcrumbsForPathname(
      "/kiem-tra-ai-dao-van/ket-qua/PRIVATE-REF",
    );

    expect(order.map((item) => item.label).join(" ")).not.toContain("HDI-SECRET-123");
    expect(result.map((item) => item.label).join(" ")).not.toContain("PRIVATE-REF");
    expect(order.at(-1)?.label).toBe("Chi tiết đơn hàng");
    expect(result.at(-1)?.label).toBe("Kết quả dịch vụ");
  });

  /**
   * Trang giới thiệu bạn bè từng rơi xuống nhánh cuối của bảng tra và in
   * "Không tìm thấy trang" ngay trên một trang chạy bình thường.
   */
  it("nhận ra trang giới thiệu bạn bè và lối vào công khai của nó", () => {
    for (const path of ["/tai-khoan/gioi-thieu", "/gioi-thieu-ban-be"]) {
      mocks.pathname = path;
      const html = renderToStaticMarkup(<SiteBreadcrumbs />);
      expect(html).toContain("Giới thiệu bạn bè");
      expect(html).not.toContain("Không tìm thấy trang");
    }
  });
});
