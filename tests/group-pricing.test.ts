import { describe, expect, it } from "vitest";
import {
  GROUP_MAX_SIZE,
  GROUP_MIN_SIZE,
  groupDiscountPct,
  groupTotalVnd,
  seatPriceVnd,
} from "@/lib/group-pricing";

const tieuLuan = { priceVnd: 300000, groupEligible: true, groupPriceVnd: 250000 };
const spss = { priceVnd: 1100000, groupEligible: true, groupPriceVnd: null };
const aiqt = { priceVnd: 3000000, groupEligible: false, groupPriceVnd: null };

describe("bậc ưu đãi nhóm", () => {
  it("không giảm gì khi chưa đủ số người", () => {
    for (let size = 1; size < GROUP_MIN_SIZE; size += 1) {
      expect(groupDiscountPct(size), `nhóm ${size}`).toBe(0);
      expect(seatPriceVnd(tieuLuan, size), `nhóm ${size}`).toBe(300000);
      expect(seatPriceVnd(spss, size), `nhóm ${size}`).toBe(1100000);
    }
  });

  it("áp bậc 10% từ đủ 3 người trở lên", () => {
    for (let size = GROUP_MIN_SIZE; size <= GROUP_MAX_SIZE; size += 1) {
      expect(groupDiscountPct(size), `nhóm ${size}`).toBe(10);
      expect(seatPriceVnd(spss, size), `nhóm ${size}`).toBe(990000);
    }
  });

  /**
   * Lý do cột `group_price_vnd` tồn tại: 300.000 → 250.000 là −16,667%, mà bậc
   * phần trăm gần nhất cho ra 249.990đ — lệch với con số in trên trang khóa học.
   */
  it("dùng giá ghi đè thay cho bậc phần trăm khi khóa có giá riêng", () => {
    expect(seatPriceVnd(tieuLuan, 3)).toBe(250000);
    expect(seatPriceVnd(tieuLuan, 10)).toBe(250000);
    // Bậc 10% sẽ ra con số khác — đó chính là thứ giá ghi đè phải thắng.
    expect(Math.round((300000 * 90) / 100)).not.toBe(250000);
  });

  it("không giảm cho khóa không tham gia ưu đãi nhóm", () => {
    expect(seatPriceVnd(aiqt, 3)).toBe(3000000);
    expect(seatPriceVnd(aiqt, GROUP_MAX_SIZE)).toBe(3000000);
  });

  it("bỏ qua giá ghi đè đắt hơn hoặc bằng giá lẻ", () => {
    // Một bản seed sai không được biến lời mời rủ bạn thành hóa đơn đắt hơn.
    const broken = { priceVnd: 300000, groupEligible: true, groupPriceVnd: 400000 };
    expect(seatPriceVnd(broken, 3)).toBe(270000);
  });

  it("chịu được số người không hợp lệ", () => {
    for (const bad of [0, -3, 2.5, NaN, Infinity, "3", null, undefined]) {
      expect(groupDiscountPct(bad), String(bad)).toBe(0);
      expect(seatPriceVnd(spss, bad), String(bad)).toBe(1100000);
    }
  });

  it("nhân giá ghế đã làm tròn với số người khi cộng tổng", () => {
    expect(groupTotalVnd([tieuLuan], 3)).toBe(750000);
    expect(groupTotalVnd([tieuLuan, spss], 3)).toBe(750000 + 990000 * 3);
    // Mua lẻ vẫn là trường hợp nhóm một người.
    expect(groupTotalVnd([tieuLuan], 1)).toBe(300000);
  });
});
