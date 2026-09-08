import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/kiem-tra-ai-dao-van/quote-form", () => ({
  QuoteForm: () => <div>QUOTE_FORM</div>,
}));
vi.mock("@/lib/analytics", () => ({ trackCta: vi.fn() }));

import AcademicRecordPage from "@/app/cong-bo/page";
import AiCheckPage from "@/app/kiem-tra-ai-dao-van/page";
import ConferenceProgramPage from "@/app/hoi-thao-quoc-te/page";

describe("điều hướng trên trang nội dung công khai", () => {
  it("không lặp nút quay lại trên trang hồ sơ học thuật", () => {
    const html = renderToStaticMarkup(<AcademicRecordPage />);

    expect(html).toContain("Công bố &amp; hồ sơ học thuật");
    expect(html).not.toContain("←");
    expect(html).not.toContain("Về trang chủ");
  });

  it("không lặp nút quay lại trên trang hội thảo quốc tế", () => {
    const html = renderToStaticMarkup(<ConferenceProgramPage />);

    expect(html).toContain("<h1");
    expect(html).toContain("Hội thảo quốc tế");
    expect(html).toContain('id="agba"');
    expect(html).toContain('id="ebes"');
    expect(html).toContain("hoi-thao-quoc-te-hero.jpg");
    expect(html).toContain("trình bày trước hội trường đông kín");
    expect(html).not.toContain("←");
    expect(html).not.toContain("Về trang chủ");
  });

  it("không lặp nút quay lại trên landing kiểm tra AI và đạo văn", async () => {
    const html = renderToStaticMarkup(
      await AiCheckPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Kiểm tra AI &amp; đạo văn");
    expect(html).not.toContain("←");
  });
});
