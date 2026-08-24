import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown-lite";

function render(markdown: string) {
  return renderToStaticMarkup(renderMarkdown(markdown));
}

describe("Markdown tối thiểu cho feedback", () => {
  it("render đủ các khối toolbar sinh ra", () => {
    const html = render(
      [
        "## Tiêu đề",
        "",
        "> Trích dẫn",
        "",
        "- Một",
        "- Hai",
        "",
        "1. Đầu",
        "2. Sau",
        "",
        "```ts",
        "const x = 1;",
        "```",
        "",
        "Đoạn một",
        "dòng hai",
      ].join("\n"),
    );

    expect(html).toContain("<h2");
    expect(html).toContain("<blockquote");
    expect(html).toContain("<ul");
    expect(html).toContain("<ol");
    expect(html).toContain("<pre");
    expect(html).toContain("const x = 1;");
    expect(html).toContain("Đoạn một<br/>dòng hai");
  });

  it("render đủ inline, còn ảnh URL chỉ là link có nhãn", () => {
    const html = render(
      "**đậm** *nghiêng* ~~gạch~~ `mã` [HDI](https://example.com/a) ![ảnh lỗi](https://example.com/a.png)",
    );

    expect(html).toContain("<strong>đậm</strong>");
    expect(html).toContain("<em>nghiêng</em>");
    expect(html).toContain("<s>gạch</s>");
    expect(html).toContain("<code");
    expect(html).toContain('href="https://example.com/a"');
    expect(html).toContain("Ảnh: ảnh lỗi");
    expect(html).not.toContain("<img");
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });

  it("bỏ URL javascript và vẫn escape chữ người dùng", () => {
    const html = render(
      "[không an toàn](javascript:alert(1)) <script>alert('x')</script>",
    );

    expect(html).toContain("không an toàn");
    expect(html).not.toContain("href=");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
