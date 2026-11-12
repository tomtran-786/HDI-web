import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkedTitle, Section, SectionHeading } from "@/components/ui/section";

/**
 * Hợp đồng markup sau redesign "chương trình hội nghị"
 * (.impeccable/surfaces/app-page-tsx.md): tiêu đề section tự mang trọng lượng,
 * không còn eyebrow in hoa phía trên và không còn nét vẽ tay. Nét vẽ tay chỉ
 * còn đi qua MarkedTitle, tối đa một lần mỗi trang.
 */
describe("SectionHeading", () => {
  it("in title nguyên văn, không có nhãn phía trên và không vẽ nét nhấn", () => {
    const html = renderToStaticMarkup(
      <SectionHeading title="Khóa học đang nhận học viên" subtitle="Phụ đề" />,
    );
    expect(html).toContain(">Khóa học đang nhận học viên</h2>");
    expect(html.indexOf("<h2")).toBeLessThan(html.indexOf("Phụ đề"));
    expect(html).not.toMatch(/<p[^>]*>[^<]*<\/p>\s*<h2/);
    expect(html).not.toContain("data-notation");
  });

  it("tiêu đề dùng màu mực, không dùng màu thương hiệu", () => {
    const html = renderToStaticMarkup(<SectionHeading title="Tiêu đề" />);
    expect(html).toMatch(/<h2 class="[^"]*\btext-fg\b/);
    expect(html).not.toContain("text-primary");
  });

  it("onBand đổi h2 sang trắng", () => {
    const html = renderToStaticMarkup(<SectionHeading title="Tiêu đề" onBand />);
    expect(html).toContain("text-white");
  });
});

describe("MarkedTitle", () => {
  afterEach(() => vi.restoreAllMocks());

  it("giữ nguyên toàn bộ chữ của title và bọc cụm nhấn trong span notation", () => {
    const html = renderToStaticMarkup(
      <MarkedTitle title="Khóa học đang nhận học viên" mark={{ text: "học viên", type: "circle" }} />,
    );
    expect(html).toContain(
      'Khóa học đang nhận <span data-notation="circle" class="whitespace-nowrap ">học viên</span>',
    );
    expect(html.replace(/<[^>]+>/g, "")).toBe("Khóa học đang nhận học viên");
  });

  it("mặc định là underline, không có whitespace-nowrap", () => {
    const html = renderToStaticMarkup(
      <MarkedTitle title="Về HDI Research Center" mark={{ text: "HDI Research Center" }} />,
    );
    expect(html).toContain('data-notation="underline"');
    expect(html).not.toContain("whitespace-nowrap");
  });

  it("mark không khớp thì vẫn render title đầy đủ và không có span notation", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <MarkedTitle title="Lộ trình học" mark={{ text: "không có" }} />,
    );
    expect(html).toBe("Lộ trình học");
    expect(warn).toHaveBeenCalled();
  });
});

describe("Section tone", () => {
  it("soft và tone=soft cùng dùng bg-bg-soft; plain dùng bg-bg", () => {
    const soft = renderToStaticMarkup(<Section soft>x</Section>);
    const tone = renderToStaticMarkup(<Section tone="soft">x</Section>);
    const plain = renderToStaticMarkup(<Section>x</Section>);
    expect(soft).toContain("bg-bg-soft");
    expect(tone).toContain("bg-bg-soft");
    expect(plain).toContain("bg-bg ");
    expect(plain).not.toContain("bg-bg-soft");
  });

  it("band dùng utility band, không mang bg-bg và không còn họa tiết vòng tròn", () => {
    const html = renderToStaticMarkup(<Section tone="band">x</Section>);
    expect(html).toMatch(/<section[^>]*class="band /);
    expect(html).not.toMatch(/\bbg-bg\b/);
    expect(html).not.toContain("<circle");
  });
});

describe("bề mặt trong globals.css", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

  it("không còn wash, gradient hay glow trang trí", () => {
    expect(css).not.toMatch(/section\.bg-bg-soft\s*\{/);
    expect(css).not.toMatch(/radial-gradient/);
    expect(css).not.toMatch(/\.band\s*\{[^}]*linear-gradient/);
    expect(css).not.toMatch(/\.scroll-progress\s*\{[^}]*box-shadow/);
  });

  it("gạch chân trong thẻ trắng nằm trên band dùng màu accent đậm, không phải màu nhạt của band", () => {
    expect(css).toMatch(
      /\.band \.bg-card \.rough-annotation path\s*\{[^}]*stroke:\s*var\(--accent\)/,
    );
  });
});
