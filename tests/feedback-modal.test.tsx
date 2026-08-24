import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Server action và router không chạy được trong môi trường Node trần của
// Vitest — mock đúng hai thứ đó, phần còn lại là component thật.
vi.mock("next/navigation", () => ({ usePathname: () => "/khoa-hoc" }));
vi.mock("@/app/actions/feedback", () => ({ submitFeedback: vi.fn() }));

import { FeedbackModal } from "@/components/feedback-modal";
import { renderMarkdown } from "@/lib/markdown-lite";

const noop = () => {};

describe("modal feedback khi đã đăng nhập", () => {
  const html = renderToStaticMarkup(
    <FeedbackModal signedIn onClose={noop} />,
  );

  it("có đủ hai nút Loại", () => {
    expect(html).toContain("Báo lỗi");
    expect(html).toContain("Góp ý");
  });

  it("có ô Tiêu đề và ô Mô tả", () => {
    expect(html).toContain('name="title"');
    expect(html).toContain('name="body"');
  });

  it("có thanh công cụ Markdown và tab Xem trước", () => {
    expect(html).toContain("Xem trước");
    expect(html).toContain("Markdown");
  });

  it("có đếm ký tự", () => {
    expect(html).toContain("ký tự");
  });

  it("gắn kèm đường dẫn trang lúc gửi", () => {
    expect(html).toContain('name="pageUrl"');
    expect(html).toContain("/khoa-hoc");
  });

  it("không hiện lời mời đăng nhập nữa", () => {
    expect(html).not.toContain("Đăng nhập để gửi");
  });
});

describe("preview markdown", () => {
  it("render được cú pháp mà thanh công cụ sinh ra", () => {
    const out = renderToStaticMarkup(
      <>{renderMarkdown("## Đầu đề\n\n**đậm** và `mã`\n\n- một\n- hai")}</>,
    );
    expect(out).toContain("<h2");
    expect(out).toContain("<strong>đậm</strong>");
    expect(out).toContain("<code");
    expect(out).toContain(">mã</code>");
    expect(out).toContain("<li>");
  });

  it("bỏ giao thức javascript: trong link", () => {
    const out = renderToStaticMarkup(
      <>{renderMarkdown("[bấm đi](javascript:alert(1))")}</>,
    );
    expect(out).not.toContain("javascript:");
    expect(out).toContain("bấm đi");
  });
});
