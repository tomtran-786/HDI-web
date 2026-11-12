import { describe, expect, it } from "vitest";
import { nav, footerNav } from "@/content/navigation";
import { aiCheckTiers } from "@/content/ai-check";

/**
 * Mục "Kiểm tra đạo văn" trên menu cấp 1 mang nhãn giá viết tay (để header
 * không kéo bảng giá vào bundle client). Đổi bảng giá mà quên nhãn thì test
 * này đỏ.
 */
describe("mục Kiểm tra đạo văn trên menu", () => {
  const item = nav.find((entry) => entry.href === "/kiem-tra-ai-dao-van");

  it("là mục cấp 1, không có menu con", () => {
    expect(item).toBeDefined();
    expect(item?.groups).toBeUndefined();
  });

  it("nhãn giá khớp mức thấp nhất của bảng giá", () => {
    const lowest = Math.min(
      ...aiCheckTiers.flatMap((tier) => Object.values(tier.prices)),
    );
    expect(item?.badge).toBe(`từ ${lowest / 1000}K`);
  });

  it("footer cũng có mục này", () => {
    expect(footerNav.some((entry) => entry.href === "/kiem-tra-ai-dao-van")).toBe(true);
  });
});
