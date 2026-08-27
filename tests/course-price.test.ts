import { describe, expect, it } from "vitest";
import { courses } from "@/content/course";

/**
 * `amount` là chuỗi để hiển thị, `vnd` là con số để tính tiền — và không có gì
 * trong TypeScript buộc hai thứ đó nói cùng một điều. Lệch nhau nghĩa là trang
 * quảng cáo một mức giá còn PayOS trừ một mức khác, nên nó được kiểm ở đây thay
 * vì trông chờ vào việc người sửa nhớ đổi cả hai dòng.
 */
function parseAmount(amount: string) {
  const digits = amount.replace(/[^\d]/g, "");
  expect(digits.length).toBeGreaterThan(0);
  return Number(digits);
}

describe("giá khóa học", () => {
  it("giữ amount và vnd nói cùng một con số", () => {
    for (const course of courses) {
      expect(parseAmount(course.price.amount), course.slug).toBe(course.price.vnd);
    }
  });

  /**
   * `deal` là mức giá CÓ ĐIỀU KIỆN và chỉ có nghĩa khi nó rẻ hơn giá gốc. Một
   * `deal` đắt hơn hoặc bằng `vnd` là một con số bị nhập nhầm chỗ, và nó sẽ hiện
   * ra dưới dạng giá gốc bị gạch ngang tuy rẻ hơn giá đang chào.
   */
  it("giữ giá ưu đãi luôn rẻ hơn giá gốc và có nêu điều kiện", () => {
    for (const course of courses) {
      const { deal } = course.price;
      if (!deal) continue;
      expect(parseAmount(deal.amount), course.slug).toBe(deal.vnd);
      expect(deal.vnd, course.slug).toBeLessThan(course.price.vnd);
      expect(deal.condition.trim().length, course.slug).toBeGreaterThan(0);
    }
  });

  it("đặt khóa nền tảng ở 300.000 đ với ưu đãi nhóm 250.000 đ", () => {
    const course = courses.find(
      (item) => item.slug === "training-tieu-luan-nckh-kltn",
    )!;
    expect(course.price.vnd).toBe(300000);
    expect(course.price.deal?.vnd).toBe(250000);
  });
});
