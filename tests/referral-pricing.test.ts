import { describe, expect, it } from "vitest";
import { seatPriceVnd } from "@/lib/group-pricing";
import {
  COMMISSION_HOLD_DAYS,
  CREDIT_MAX_SHARE_PCT,
  CREDIT_TTL_MONTHS,
  commissionAvailableAt,
  commissionExpiresAt,
  creditToApply,
  maxCreditForTuitionVnd,
  MIN_CHARGE_VND,
  REFERRAL_COMMISSION_PCT,
  REFERRAL_DISCOUNT_PCT,
  REWARDED_REFERRALS_MAX,
  REWARD_WINDOW_MONTHS,
  referralCommissionVnd,
  referralDiscountVnd,
  rewardWindowStart,
} from "@/lib/referral-pricing";

/** Mua lẻ: không có ưu đãi nhóm nào để so, list và subtotal bằng nhau. */
const solo = (subtotalVnd: number, eligible = true) =>
  referralDiscountVnd({ listSubtotalVnd: subtotalVnd, subtotalVnd, eligible });

describe("giảm giá giới thiệu", () => {
  it("giữ nguyên các con số đã chốt với HDI", () => {
    expect(REFERRAL_DISCOUNT_PCT).toBe(10);
    expect(REFERRAL_COMMISSION_PCT).toBe(10);
    expect(CREDIT_MAX_SHARE_PCT).toBe(30);
    expect(CREDIT_TTL_MONTHS).toBe(6);
    expect(COMMISSION_HOLD_DAYS).toBe(7);
    expect(REWARDED_REFERRALS_MAX).toBe(5);
    expect(REWARD_WINDOW_MONTHS).toBe(6);
  });

  it("không giảm gì khi người mua không đủ điều kiện", () => {
    expect(solo(1_000_000, false)).toBe(0);
  });

  it("giảm 10% trên tổng đơn khi mua lẻ", () => {
    expect(solo(1_000_000)).toBe(100_000);
  });

  /**
   * ĐÂY LÀ BÀI QUAN TRỌNG NHẤT CỦA FILE, và là thứ đổi hành vi ngày 2026-09-01.
   *
   * Trước đó khoản giảm 10% được trừ TIẾP lên giá đã giảm nhóm, nên nhóm ba
   * người được giới thiệu giảm gần 19%. Chính sách nói các ưu đãi không cộng
   * dồn: đơn chỉ hưởng mức cao nhất.
   */
  it("KHÔNG cộng dồn với ưu đãi nhóm — đơn chỉ hưởng mức cao nhất", () => {
    const course = { priceVnd: 1_000_000, groupEligible: true, groupPriceVnd: null };
    const seat = seatPriceVnd(course, 3);
    expect(seat).toBe(900_000);

    const listSubtotal = 1_000_000 * 3;
    const subtotal = seat * 3;
    // Ưu đãi nhóm đã giảm đúng 10%, tức bằng mức giới thiệu → không bù thêm.
    expect(
      referralDiscountVnd({ listSubtotalVnd: listSubtotal, subtotalVnd: subtotal, eligible: true }),
    ).toBe(0);
    expect(subtotal).toBe(2_700_000);
  });

  it("bù cho đủ mức cao nhất khi ưu đãi nhóm nhỏ hơn 10%", () => {
    // Một khóa có giá ưu đãi nhóm ghi đè chỉ giảm 5%.
    const listSubtotal = 1_000_000;
    const subtotal = 950_000;
    const discount = referralDiscountVnd({
      listSubtotalVnd: listSubtotal,
      subtotalVnd: subtotal,
      eligible: true,
    });
    expect(discount).toBe(50_000);
    // Tổng cuối cùng đúng bằng mức ưu đãi cao nhất, không phải tổng hai mức.
    expect(subtotal - discount).toBe(900_000);
  });

  it("làm tròn đúng một lần, không tích lũy sai số", () => {
    expect(solo(333_333)).toBe(33_333);
    expect(solo(999_999)).toBe(100_000);
  });

  it("không để khoản giảm đẩy đơn xuống dưới ngưỡng trả được", () => {
    expect(solo(10_000)).toBe(1_000);
    expect(solo(MIN_CHARGE_VND)).toBe(0);
    expect(solo(1_000)).toBe(0);
  });

  it("bỏ qua đầu vào vô nghĩa thay vì sinh số âm", () => {
    expect(solo(0)).toBe(0);
    expect(solo(-1)).toBe(0);
    expect(solo(1.5)).toBe(0);
    // Giá niêm yết không bao giờ nhỏ hơn giá đã giảm; nếu có thì dữ liệu hỏng.
    expect(
      referralDiscountVnd({ listSubtotalVnd: 100, subtotalVnd: 1_000, eligible: true }),
    ).toBe(0);
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

describe("mốc thời gian của credits", () => {
  it("giữ hoa hồng đúng bảy ngày sau khi tiền về", () => {
    const now = new Date("2026-09-01T10:00:00.000Z");
    expect(commissionAvailableAt(now).toISOString()).toBe(
      "2026-09-08T10:00:00.000Z",
    );
  });

  it("cho hạn dùng sáu tháng", () => {
    const now = new Date("2026-09-01T10:00:00.000Z");
    expect(commissionExpiresAt(now).toISOString()).toBe(
      "2027-03-01T10:00:00.000Z",
    );
  });

  /**
   * `setMonth` trần đẩy 31/08 + 6 tháng sang 03/03. Một hạn dùng nhảy sang
   * tháng khác là thứ không giải thích được với người đang nhìn số dư của mình.
   */
  it("kẹp về ngày cuối tháng thay vì tràn sang tháng sau", () => {
    expect(
      commissionExpiresAt(new Date("2026-08-31T00:00:00.000Z")).toISOString(),
    ).toBe("2027-02-28T00:00:00.000Z");
  });

  it("mở cửa sổ đếm lượt thưởng lùi đúng sáu tháng", () => {
    expect(
      rewardWindowStart(new Date("2026-09-01T00:00:00.000Z")).toISOString(),
    ).toBe("2026-03-01T00:00:00.000Z");
  });
});

describe("trừ credits vào đơn", () => {
  /** Học phí đủ lớn để trần 30% không phải thứ đang chặn phép tính. */
  const roomy = { tuitionVnd: 10_000_000 };

  it("không trừ gì khi học viên chưa bật", () => {
    expect(
      creditToApply({ balanceVnd: 500_000, dueVnd: 900_000, ...roomy, wanted: false }),
    ).toBe(0);
  });

  it("trừ trọn số dư khi đơn còn đủ chỗ", () => {
    expect(
      creditToApply({ balanceVnd: 100_000, dueVnd: 900_000, ...roomy, wanted: true }),
    ).toBe(100_000);
  });

  /**
   * Trần 30% học phí một lần đăng ký, theo chính sách 2026-09-01: khóa
   * 1.000.000đ thì dù số dư bao nhiêu cũng chỉ trừ được 300.000đ.
   */
  it("không cho credits gánh quá 30% học phí của lần đăng ký", () => {
    expect(maxCreditForTuitionVnd(1_000_000)).toBe(300_000);
    expect(
      creditToApply({
        balanceVnd: 5_000_000,
        dueVnd: 1_000_000,
        tuitionVnd: 1_000_000,
        wanted: true,
      }),
    ).toBe(300_000);
  });

  it("tính trần trên học phí, không trên số còn phải trả", () => {
    // Cùng một khóa 1.000.000đ, người mua được giảm 10% giới thiệu: trần vẫn là
    // 300.000đ chứ không tụt theo số còn nợ, nếu không cùng một khóa lại ra hai
    // mức trần khác nhau tùy người mua có được giảm hay không.
    expect(
      creditToApply({
        balanceVnd: 5_000_000,
        dueVnd: 900_000,
        tuitionVnd: 1_000_000,
        wanted: true,
      }),
    ).toBe(300_000);
  });

  /**
   * Đơn 0đ không tạo được link PayOS, và HDI cố ý không có đường xác nhận thanh
   * toán nào khác — khách sẽ kẹt ở ngõ cụt mà không hiểu vì sao.
   */
  it("luôn chừa lại ít nhất ngưỡng tối thiểu để trả", () => {
    expect(
      creditToApply({ balanceVnd: 5_000_000, dueVnd: 900_000, ...roomy, wanted: true }),
    ).toBe(900_000 - MIN_CHARGE_VND);
    expect(
      creditToApply({ balanceVnd: 900_000, dueVnd: 900_000, ...roomy, wanted: true }),
    ).toBe(900_000 - MIN_CHARGE_VND);
  });

  it("không trừ gì khi đơn đã ở đúng ngưỡng tối thiểu", () => {
    expect(
      creditToApply({
        balanceVnd: 500_000,
        dueVnd: MIN_CHARGE_VND,
        ...roomy,
        wanted: true,
      }),
    ).toBe(0);
  });

  it("bỏ qua số dư rỗng hoặc âm", () => {
    expect(
      creditToApply({ balanceVnd: 0, dueVnd: 900_000, ...roomy, wanted: true }),
    ).toBe(0);
    expect(
      creditToApply({ balanceVnd: -50_000, dueVnd: 900_000, ...roomy, wanted: true }),
    ).toBe(0);
  });

  it("phần dư không bị mất — chỉ trừ đúng phần dùng được", () => {
    const applied = creditToApply({
      balanceVnd: 5_000_000,
      dueVnd: 900_000,
      ...roomy,
      wanted: true,
    });
    expect(5_000_000 - applied).toBe(5_000_000 - (900_000 - MIN_CHARGE_VND));
  });
});
