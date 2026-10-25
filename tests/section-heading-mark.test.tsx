import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Section, SectionHeading } from "@/components/ui/section";

describe("SectionHeading mark", () => {
  afterEach(() => vi.restoreAllMocks());

  it("giữ nguyên toàn bộ chữ của title và bọc cụm nhấn trong span notation", () => {
    const html = renderToStaticMarkup(
      <SectionHeading
        title="Khóa học đang nhận học viên"
        mark={{ text: "học viên", type: "circle" }}
      />,
    );
    expect(html).toContain(
      'Khóa học đang nhận <span data-notation="circle" class="whitespace-nowrap ">học viên</span>',
    );
    expect(html.replace(/<[^>]+>/g, "")).toContain("Khóa học đang nhận học viên");
  });

  it("mặc định là underline, không có whitespace-nowrap", () => {
    const html = renderToStaticMarkup(
      <SectionHeading title="Về HDI Research Center" mark={{ text: "HDI Research Center" }} />,
    );
    expect(html).toContain('data-notation="underline"');
    expect(html).not.toContain("whitespace-nowrap");
  });

  it("mark không khớp thì vẫn render title đầy đủ và không có span notation", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <SectionHeading title="Lộ trình học" mark={{ text: "không có" }} />,
    );
    expect(html).toContain("Lộ trình học");
    expect(html).not.toContain("data-notation");
    expect(warn).toHaveBeenCalled();
  });

  it("onBand đổi h2 sang trắng và eyebrow sang accent", () => {
    const html = renderToStaticMarkup(
      <SectionHeading eyebrow="Nhãn" title="Tiêu đề" onBand />,
    );
    expect(html).toContain("text-white");
    expect(html).toContain("text-accent");
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

  it("band dùng utility band, có họa tiết vòng tròn và không mang bg-bg", () => {
    const html = renderToStaticMarkup(<Section tone="band">x</Section>);
    expect(html).toMatch(/<section[^>]*class="band /);
    expect(html).not.toMatch(/\bbg-bg\b/);
    expect(html).toContain("<circle");
  });
});
