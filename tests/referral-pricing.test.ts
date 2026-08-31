import { describe, expect, it } from "vitest";
import { seatPriceVnd } from "@/lib/group-pricing";
import {
  creditToApply,
  MIN_CHARGE_VND,
  REFERRAL_COMMISSION_PCT,
  REFERRAL_DISCOUNT_PCT,
  referralCommissionVnd,
  referralDiscountVnd,
} from "@/lib/referral-pricing";

describe("giảm giá giới thiệu", () => {
  it("giữ nguyên hai tỷ lệ đã chốt với HDI", () => {
    expect(REFERRAL_DISCOUNT_PCT).toBe(10);
    expect(REFERRAL_COMMISSION_PCT).toBe(10);
  });

  it("không giảm gì khi người mua không đủ điều kiện", () => {
    expect(referralDiscountVnd(1_000_000, false)).toBe(0);
  });

  it("giảm 10% trên tổng đơn", () => {
    expect(referralDiscountVnd(1_000_000, true)).toBe(100_000);
  });

  /**
   * Ưu đãi nhóm áp TRƯỚC. Tính 10% trên giá niêm yết khi đơn đã được giảm nhóm
   * là trả thưởng trên số tiền chưa bao giờ về tài khoản.
   */
  it("cộng dồn với ưu đãi nhóm bằng cách tính trên tiền thực thu", () => {
    const course = { priceVnd: 1_000_000, groupEligible: true, groupPriceVnd: null };
    const seat = seatPriceVnd(course, 3);
    expect(seat).toBe(900_000);

    const subtotal = seat * 3;
    expect(referralDiscountVnd(subtotal, true)).toBe(270_000);
    expect(subtotal - referralDiscountVnd(subtotal, true)).toBe(2_430_000);
  });

  it("làm tròn đúng một lần, không tích lũy sai số", () => {
    // 333.333 × 10% = 33.333,3 → 33.333. Cộng ba lần rồi mới giảm phải ra cùng
    // kết quả với việc giảm trên tổng, vì chỉ có MỘT lần làm tròn.
    expect(referralDiscountVnd(333_333, true)).toBe(33_333);
    expect(referralDiscountVnd(999_999, true)).toBe(100_000);
  });

  it("không để khoản giảm đẩy đơn xuống dưới ngưỡng trả được", () => {
    // 10.000đ × 10% = 1.000đ, còn lại 9.000đ — thoải mái.
    expect(referralDiscountVnd(10_000, true)).toBe(1_000);
    // 2.000đ thì không giảm nổi đồng nào mà vẫn còn trả được.
    expect(referralDiscountVnd(MIN_CHARGE_VND, true)).toBe(0);
    expect(referralDiscountVnd(1_000, true)).toBe(0);
  });

  it("bỏ qua đầu vào vô nghĩa thay vì sinh số âm", () => {
    expect(referralDiscountVnd(0, true)).toBe(0);
    expect(referralDiscountVnd(-1, true)).toBe(0);
    expect(referralDiscountVnd(1.5, true)).toBe(0);
  });
});

describe("hoa hồng giới thiệu", () => {
  it("cộng 10% trên căn cứ", () => {
    expect(referralCommissionVnd(900_000)).toBe(90_000);
  });

  it("làm tròn một lần", () => {
    expect(referralCommissionVnd(333_333)).toBe(33_333);
  });

  it("không sinh dòng cho căn cứ rỗng", () => {
    expect(referralCommissionVnd(0)).toBe(0);
    expect(referralCommissionVnd(-100)).toBe(0);
  });
});

describe("trừ credits vào đơn", () => {
  it("không trừ gì khi học viên chưa bật", () => {
    expect(creditToApply({ balanceVnd: 500_000, dueVnd: 900_000, wanted: false })).toBe(0);
  });

  it("trừ trọn số dư khi đơn còn đủ chỗ", () => {
    expect(creditToApply({ balanceVnd: 100_000, dueVnd: 900_000, wanted: true })).toBe(
      100_000,
    );
  });

  /**
   * Đây là bài quan trọng nhất của file. Đơn 0đ không tạo được link PayOS, và
   * HDI cố ý không có đường xác nhận thanh toán nào khác — khách sẽ kẹt ở ngõ
   * cụt mà không hiểu vì sao.
   */
  it("luôn chừa lại ít nhất ngưỡng tối thiểu để trả", () => {
    expect(creditToApply({ balanceVnd: 5_000_000, dueVnd: 900_000, wanted: true })).toBe(
      900_000 - MIN_CHARGE_VND,
    );
    expect(creditToApply({ balanceVnd: 900_000, dueVnd: 900_000, wanted: true })).toBe(
      900_000 - MIN_CHARGE_VND,
    );
  });

  it("không trừ gì khi đơn đã ở đúng ngưỡng tối thiểu", () => {
    expect(
      creditToApply({ balanceVnd: 500_000, dueVnd: MIN_CHARGE_VND, wanted: true }),
    ).toBe(0);
  });

  it("bỏ qua số dư rỗng hoặc âm", () => {
    expect(creditToApply({ balanceVnd: 0, dueVnd: 900_000, wanted: true })).toBe(0);
    expect(creditToApply({ balanceVnd: -50_000, dueVnd: 900_000, wanted: true })).toBe(0);
  });

  it("phần dư không bị mất — chỉ trừ đúng phần dùng được", () => {
    const applied = creditToApply({ balanceVnd: 5_000_000, dueVnd: 900_000, wanted: true });
    expect(5_000_000 - applied).toBe(5_000_000 - (900_000 - MIN_CHARGE_VND));
  });
});
