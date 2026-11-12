import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({ trackCta: vi.fn() }));
vi.mock("@/app/kiem-tra-ai-dao-van/actions", () => ({ startServiceCheckout: vi.fn() }));

import { AiCheckTeaser } from "@/components/ai-check-teaser";
import AiCheckPage from "@/app/kiem-tra-ai-dao-van/page";
import { aiCheck, aiCheckFromPrices } from "@/content/ai-check";

describe("ô tính giá kiểm tra AI & đạo văn ở trang chủ", () => {
  it("chưa gõ số từ thì hiện giá thấp nhất của cả ba loại, kèm chữ 'từ'", () => {
    const html = renderToStaticMarkup(<AiCheckTeaser />);
    for (const price of Object.values(aiCheckFromPrices)) {
      expect(html).toContain(`${Math.round(price / 1000)}K`);
    }
    expect(html).toMatch(/từ <\/span>50K/);
    expect(html).toContain('inputMode="numeric"');
  });

  it("nút Đặt kiểm tra mang loại đã chọn sang form của trang dịch vụ", () => {
    const html = renderToStaticMarkup(<AiCheckTeaser />);
    expect(html).toContain('href="/kiem-tra-ai-dao-van?dichVu=ai#tinh-chi-phi"');
    // Chưa có số từ thì không gửi `soTu` rỗng sang trang dịch vụ.
    expect(html).not.toContain("soTu=");
  });
});

describe("/kiem-tra-ai-dao-van", () => {
  it("hiện bốn bước, ba cam kết và form có neo #tinh-chi-phi", async () => {
    const html = renderToStaticMarkup(
      await AiCheckPage({ searchParams: Promise.resolve({ soTu: "8000", dichVu: "combo" }) } as never),
    );
    for (const step of aiCheck.steps) expect(html).toContain(step.title);
    for (const promise of aiCheck.promises) expect(html).toContain(promise.title);
    expect(html).toContain('id="tinh-chi-phi"');
    // Số từ từ trang chủ được điền sẵn vào form.
    expect(html).toContain('value="8000"');
  });
});
