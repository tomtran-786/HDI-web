/**
 * Toán của chương trình giới thiệu bạn bè.
 *
 * Hàm thuần, không I/O, dùng chung cho trình duyệt và server — cùng lý do như
 * `lib/group-pricing.ts`: con số hiện trên giỏ hàng và con số gửi sang PayOS
 * phải do CÙNG một hàm sinh ra. Ở đây lý do còn gắt hơn một bậc, vì
 * `app/actions/checkout.ts` so `tongTienDuKien` với `amountVnd` bằng phép so
 * bằng tuyệt đối rồi HỦY đơn nếu lệch: giỏ hàng tính sai một đồng nghĩa là mọi
 * học viên được giới thiệu đều không thanh toán được.
 *
 * KHÔNG nhận số tiền nào từ trình duyệt. Mọi đầu vào ở đây đến từ database hoặc
 * từ một phép cộng của server (BR-02).
 */

/** Người mới được giảm bấy nhiêu phần trăm, ở đơn ĐẦU TIÊN của họ. */
export const REFERRAL_DISCOUNT_PCT = 10;

/** Người giới thiệu được cộng bấy nhiêu phần trăm tiền thực thu của đơn đó. */
export const REFERRAL_COMMISSION_PCT = 10;

/**
 * Số tiền tối thiểu một đơn phải còn lại để đi qua được cổng thanh toán.
 *
 * Credits BẮT BUỘC phải bị kẹp trần theo hằng số này. Nếu để số dư ăn hết số
 * phải trả thì đơn còn 0đ: PayOS không tạo được link, và HDI thì cố ý không có
 * đường xác nhận thanh toán nào khác ngoài webhook đã ký (xem ghi chú
 * "deliberately no markPaid" ở app/quan-tri/actions.ts). Khách rơi vào ngõ cụt
 * mà không hiểu vì sao. Phần dư không mất — nó nằm lại trong sổ cho lần sau.
 *
 * Ràng buộc `orders_amount_vnd_positive_check` trong database là lớp thứ hai
 * của chính luật này.
 */
export const MIN_CHARGE_VND = 2000;

/**
 * Khoản giảm cho người được giới thiệu, tính trên TIỀN THỰC THU.
 *
 * `subtotalVnd` đã là tổng các giá ghế sau ưu đãi nhóm. Thứ tự đó là cố ý: giảm
 * nhóm áp trước, 10% giới thiệu tính trên phần còn lại. Tính trên giá niêm yết
 * sẽ khiến chi phí thực của chương trình vượt quá 10% doanh thu.
 *
 * Làm tròn đúng MỘT lần, ở đây, từ con số chính xác. Ưu đãi nhóm đã làm tròn ở
 * mức GHẾ trong `seatPriceVnd`; làm tròn thêm một nhịp nữa trên cùng một con số
 * là cách đối soát không bao giờ ra 0.
 */
export function referralDiscountVnd(subtotalVnd: number, eligible: boolean): number {
  if (!eligible) return 0;
  if (!Number.isInteger(subtotalVnd) || subtotalVnd <= 0) return 0;

  const discount = Math.round((subtotalVnd * REFERRAL_DISCOUNT_PCT) / 100);
  // Cùng một trần với credits, vì cùng một lý do: đơn phải còn trả được.
  return Math.min(discount, Math.max(0, subtotalVnd - MIN_CHARGE_VND));
}

/**
 * Hoa hồng ghi cho người giới thiệu.
 *
 * `basisVnd` là tiền thực thu của đơn — tức số tiền đã trừ ưu đãi nhóm và đã
 * trừ khoản giảm 10% của chính người mua, NHƯNG chưa trừ credits. Credits là
 * khoản thưởng đã ghi nợ từ trước chứ không phải một khoản giảm giá; trừ nó ra
 * khỏi căn cứ nữa là tính hai lần trên cùng một đồng.
 */
export function referralCommissionVnd(basisVnd: number): number {
  if (!Number.isInteger(basisVnd) || basisVnd <= 0) return 0;
  return Math.round((basisVnd * REFERRAL_COMMISSION_PCT) / 100);
}

/**
 * Số credits thực sự được trừ vào một đơn.
 *
 * `wanted` là ý muốn của học viên (checkbox trong giỏ hàng) — trình duyệt chỉ
 * được gửi lên đúng một giá trị bật/tắt, không bao giờ là số tiền.
 *
 * PHẢI gọi bên trong transaction đã khóa hàng user, nếu không hai tab checkout
 * song song sẽ cùng đọc một số dư và cùng tiêu hết nó.
 */
export function creditToApply(input: {
  balanceVnd: number;
  dueVnd: number;
  wanted: boolean;
}): number {
  if (!input.wanted) return 0;
  if (!Number.isInteger(input.balanceVnd) || input.balanceVnd <= 0) return 0;
  if (!Number.isInteger(input.dueVnd) || input.dueVnd <= 0) return 0;

  const headroom = Math.max(0, input.dueVnd - MIN_CHARGE_VND);
  return Math.max(0, Math.min(input.balanceVnd, headroom));
}
