import { describe, expect, it } from "vitest";
import { aiCheckTiers, WORD_LIMIT } from "@/content/ai-check";
import { quote } from "@/lib/ai-check-pricing";

/**
 * Hàm này quyết định số tiền in trên màn hình VÀ số tiền gửi sang PayOS, nên
 * biên của nó được kiểm từng số một: một ranh giới lệch đi một đơn vị ở đây là
 * một hóa đơn sai, không phải một pixel sai.
 */
describe("bảng giá check AI & đạo văn", () => {
  it("dùng đúng sáu mức giá HDI đưa ra", () => {
    expect(quote(8_000, "ai")).toEqual({
      ok: true,
      tier: "duoi-40-trang",
      amountVnd: 35_000,
    });
    expect(quote(8_000, "plagiarism")).toMatchObject({ amountVnd: 25_000 });
    expect(quote(8_000, "combo")).toMatchObject({ amountVnd: 50_000 });

    expect(quote(15_000, "ai")).toEqual({
      ok: true,
      tier: "tren-40-trang",
      amountVnd: 50_000,
    });
    expect(quote(15_000, "plagiarism")).toMatchObject({ amountVnd: 35_000 });
    expect(quote(15_000, "combo")).toMatchObject({ amountVnd: 70_000 });
  });

  it('xếp đúng 10.000 từ vào bậc rẻ hơn, theo dấu "≤" của bảng', () => {
    expect(quote(9_999, "combo")).toMatchObject({ tier: "duoi-40-trang" });
    expect(quote(10_000, "combo")).toMatchObject({
      tier: "duoi-40-trang",
      amountVnd: 50_000,
    });
    expect(quote(10_001, "combo")).toMatchObject({
      tier: "tren-40-trang",
      amountVnd: 70_000,
    });
  });

  it("nhận đúng trần bảng giá rồi từ chối số từ vượt trần", () => {
    expect(WORD_LIMIT).toBe(29_000);
    expect(quote(29_000, "ai")).toMatchObject({ ok: true, amountVnd: 50_000 });
    expect(quote(29_001, "ai")).toEqual({ ok: false, reason: "too_long" });
    expect(quote(1_000_000, "combo")).toEqual({ ok: false, reason: "too_long" });
  });

  it("từ chối mọi đầu vào không phải số từ hợp lệ", () => {
    for (const bad of [0, -1, 1.5, NaN, Infinity, "8000", null, undefined, {}, []]) {
      expect(quote(bad, "ai")).toEqual({ ok: false, reason: "invalid_words" });
    }
  });

  it("từ chối loại dịch vụ không nằm trong danh sách", () => {
    for (const bad of ["", "AI", "humanize", "__proto__", 1, null, {}]) {
      expect(quote(5_000, bad)).toEqual({ ok: false, reason: "invalid_kind" });
    }
  });

  it("phủ hết mọi bậc trong content — bảng giá mới cũng phải có giá", () => {
    for (const tier of aiCheckTiers) {
      const priced = quote(tier.maxWords, "combo");
      expect(priced.ok).toBe(true);
      if (priced.ok) expect(priced.amountVnd).toBeGreaterThan(0);
    }
  });
});
