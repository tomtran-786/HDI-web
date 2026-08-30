import { describe, expect, it } from "vitest";
import { courses } from "@/content/course";
import { GROUP_MIN_SIZE, seatPriceVnd } from "@/lib/group-pricing";

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

  /**
   * BẤT BIẾN QUAN TRỌNG NHẤT của tính năng thanh toán nhóm.
   *
   * Giá in trên trang khóa học và giá `createOrder` gửi sang PayOS đi qua hai
   * đường khác nhau: một bên là `content/course.ts`, bên kia là các cột
   * `group_eligible`/`group_price_vnd` do `prisma/seed.ts` nạp. Test này ghép
   * hai đường lại — sửa con số ở một bên mà quên bên kia sẽ đỏ ngay tại đây chứ
   * không phải ở màn hình thanh toán của học viên.
   */
  it("giữ giá nhóm được quảng cáo đúng bằng giá nhóm sẽ bị trừ", () => {
    for (const course of courses) {
      const configured = {
        priceVnd: course.price.vnd,
        groupEligible: course.price.group === true,
        groupPriceVnd:
          course.price.group === true ? (course.price.deal?.vnd ?? null) : null,
      };
      const charged = seatPriceVnd(configured, GROUP_MIN_SIZE);

      if (!course.price.group) {
        // Khóa không quảng cáo ưu đãi nhóm thì nhóm vẫn trả giá lẻ.
        expect(charged, course.slug).toBe(course.price.vnd);
        continue;
      }

      if (course.price.deal) {
        // Có con số cụ thể trên trang → phải bị trừ đúng con số đó.
        expect(charged, course.slug).toBe(course.price.deal.vnd);
      } else {
        // Chỉ hứa phần trăm → bậc chung phải khớp phần trăm đã hứa.
        const promised = course.price.note.match(/Giảm (\d+)%/);
        expect(promised, `${course.slug}: note phải nêu mức giảm`).not.toBeNull();
        const pct = Number(promised![1]);
        expect(charged, course.slug).toBe(
          Math.round((course.price.vnd * (100 - pct)) / 100),
        );
      }
    }
  });

  it("chỉ bật ưu đãi nhóm cho khóa thật sự quảng cáo ưu đãi đó", () => {
    for (const course of courses) {
      if (course.price.group !== true) continue;
      const advertises =
        Boolean(course.price.deal) || /nhóm/i.test(course.price.note);
      expect(advertises, `${course.slug}: bật group nhưng không quảng cáo`).toBe(true);
    }
    // AIQT không hứa gì về nhóm, nên không được âm thầm giảm giá.
    const aiqt = courses.find((item) => item.code === "AIQT")!;
    expect(aiqt.price.group).toBeUndefined();
  });
});
