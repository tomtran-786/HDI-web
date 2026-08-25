import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";
import NotFound from "@/app/not-found";

describe("hành động trên trang fallback", () => {
  it("404 dùng breadcrumb để về Home, không render thêm nút trùng", () => {
    const html = renderToStaticMarkup(<NotFound />);

    expect(html).not.toContain('href="/"');
    expect(html).not.toContain("Về trang chủ");
    expect(html).not.toContain("<a");
  });

  it("error chỉ giữ hành động thử lại", () => {
    const html = renderToStaticMarkup(
      <ErrorPage error={new Error("offline")} reset={vi.fn()} />,
    );

    expect(html).toContain("Thử lại");
    expect(html).not.toContain('href="/"');
    expect(html).not.toContain("Về trang chủ");
  });
});
