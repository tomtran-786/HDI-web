/**
 * Bậc ưu đãi khi nhiều người cùng ghi danh trong một lần thanh toán.
 *
 * Hàm thuần, dùng chung cho trình duyệt và server — cùng lý do như
 * `lib/ai-check-pricing.ts`: con số hiện trên giỏ hàng và con số gửi sang PayOS
 * phải do CÙNG một hàm sinh ra, nếu không thì bảng giá đổi một cái là hai bên
 * lệch nhau, và cái lệch đó là hóa đơn sai chứ không phải lỗi hiển thị.
 *
 * KHÔNG nhận số tiền từ đầu vào. `seatPriceVnd` chỉ nhận cấu hình khóa học đọc
 * từ database, đúng theo BR-02.
 */

/** Dưới ngưỡng này thì không có nhóm, chỉ có vài người mua lẻ cùng lúc. */
export const GROUP_MIN_SIZE = 3;

/**
 * Nhóm trưởng + 9 thành viên.
 *
 * Trần này không phải để chống gian lận — nó chặn một ô nhập email biến thành
 * công cụ tạo hàng loạt ghi danh trong một transaction, và giữ số lần cấp quyền
 * Drive sau webhook nằm trong thời lượng một lambda.
 */
export const GROUP_MAX_SIZE = 10;

/**
 * Bậc giảm giá dùng chung cả catalogue, xếp tăng dần theo `minSize`.
 *
 * Đây là nơi DUY NHẤT định nghĩa "nhóm bao nhiêu người thì giảm bao nhiêu".
 * Thêm bậc mới (ví dụ từ 5 người giảm 15%) chỉ là thêm một dòng ở đây.
 */
export const GROUP_TIERS = [{ minSize: 3, discountPct: 10 }] as const;

/** Cấu hình giá nhóm của một khóa, đúng những cột `createOrder` khóa dòng đọc. */
export type GroupPricedCourse = {
  priceVnd: number;
  groupEligible: boolean;
  groupPriceVnd: number | null;
};

export function isGroupSize(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

/** Phần trăm giảm của bậc cao nhất mà nhóm này với tới. 0 nghĩa là chưa đủ người. */
export function groupDiscountPct(groupSize: unknown): number {
  if (!isGroupSize(groupSize)) return 0;
  let best = 0;
  for (const tier of GROUP_TIERS) {
    if (groupSize >= tier.minSize && tier.discountPct > best) best = tier.discountPct;
  }
  return best;
}

/**
 * Giá MỘT ghế trong nhóm, tính bằng đồng.
 *
 * `groupPriceVnd` ghi đè bậc phần trăm vì có ưu đãi không biểu diễn được bằng
 * phần trăm hai chữ số thập phân: khóa TIEULUAN rao 300.000đ → 250.000đ, tức
 * −16,667%. Làm tròn từ 16,67% ra 249.990đ — lệch 10đ so với con số in trên
 * trang khóa học. Vì `classifyPayosPayment` đòi số tiền khớp tuyệt đối, một mức
 * giá lệch với quảng cáo là lỗi nghiệp vụ chứ không phải lỗi làm tròn.
 *
 * Làm tròn xảy ra đúng MỘT lần, ở đây. Nơi nào cần tổng tiền thì cộng các giá
 * ghế đã làm tròn lại — cộng trước rồi mới làm tròn sẽ ra một con số khác.
 */
export function seatPriceVnd(course: GroupPricedCourse, groupSize: unknown): number {
  if (!course.groupEligible) return course.priceVnd;
  const pct = groupDiscountPct(groupSize);
  if (pct <= 0) return course.priceVnd;

  // Giá ghi đè vẫn phải rẻ hơn giá lẻ. Ràng buộc CHECK trong database đã giữ
  // điều đó, nhưng một bản seed sai không được phép biến thành một hóa đơn đắt
  // hơn mua lẻ chỉ vì khách rủ thêm bạn.
  if (course.groupPriceVnd !== null && course.groupPriceVnd < course.priceVnd) {
    return course.groupPriceVnd;
  }
  return Math.round((course.priceVnd * (100 - pct)) / 100);
}

/** Tổng tiền cả nhóm cho một giỏ: mỗi khóa × mỗi người, giá ghế đã làm tròn. */
export function groupTotalVnd(courses: GroupPricedCourse[], groupSize: number): number {
  return courses.reduce((sum, course) => sum + seatPriceVnd(course, groupSize) * groupSize, 0);
}
