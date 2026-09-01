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
 * Credits chỉ được trả tối đa bấy nhiêu phần trăm học phí của MỘT lần đăng ký.
 *
 * Chính sách 2026-09-01: khóa 1.000.000 đ thì tối đa dùng 300.000 đ credits.
 * Trần này tính trên học phí của lần đăng ký (tổng giá ghế), không tính trên số
 * còn phải trả sau khi đã trừ ưu đãi — nếu tính trên số sau khi trừ thì cùng
 * một khóa lại ra hai mức trần khác nhau tùy người mua có được giảm hay không.
 */
export const CREDIT_MAX_SHARE_PCT = 30;

/**
 * Credits hết hạn sau bấy nhiêu tháng kể từ lúc được ghi sổ.
 *
 * Đây là một khoản nợ của HDI với học viên; không có hạn thì nó nằm trên sổ mãi
 * mãi và không bao giờ đóng được kỳ nào.
 */
export const CREDIT_TTL_MONTHS = 6;

/**
 * Credits nằm im bấy nhiêu ngày trước khi tiêu được.
 *
 * Chính sách nói credits "chỉ phát sinh sau khi học viên mới thanh toán đầy đủ
 * và hết thời hạn hoàn phí". HDI chưa có luồng hoàn phí tự phục vụ, nên mốc đó
 * được hiện thực hóa bằng đúng một khoảng chờ kể từ lúc webhook xác nhận tiền
 * về. Trả thưởng ngay lập tức là trả trên một khoản tiền vẫn có thể chảy ngược.
 */
export const COMMISSION_HOLD_DAYS = 7;

/** Số lượt giới thiệu được thưởng credits trong một cửa sổ trượt. */
export const REWARDED_REFERRALS_MAX = 5;

/** Độ dài cửa sổ trượt đếm số lượt thưởng, tính bằng tháng. */
export const REWARD_WINDOW_MONTHS = 6;

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
 * Khoản giảm cho người được giới thiệu, KHÔNG cộng dồn với ưu đãi nhóm.
 *
 * Chính sách 2026-09-01: một đơn đủ điều kiện nhiều ưu đãi thì chỉ hưởng mức
 * cao nhất. Trước đó `subtotalVnd` (đã trừ ưu đãi nhóm) bị trừ tiếp 10%, nên
 * nhóm ba người được giới thiệu giảm gần 19% — hai ưu đãi chồng lên nhau.
 *
 * Cách hiện thực: trả về PHẦN CHÊNH giữa mức 10% tính trên giá niêm yết và
 * khoản mà ưu đãi nhóm đã giảm sẵn. Nhờ vậy bất biến
 * `amount_vnd = SUM(order_items.price_vnd) − referral − credit` giữ nguyên và
 * giá từng ghế không phải tính lại theo việc người mua có được giới thiệu hay
 * không.
 *
 *   mua lẻ            → listSubtotal === subtotal → đúng 10% như cũ
 *   nhóm giảm 10%     → phần chênh = 0 → chỉ còn ưu đãi nhóm
 *   nhóm giảm ít hơn  → bù thêm cho đủ 10%, tức mức cao nhất
 *
 * Làm tròn đúng MỘT lần, ở đây, từ giá niêm yết. Ưu đãi nhóm đã làm tròn ở mức
 * GHẾ trong `seatPriceVnd`; làm tròn thêm một nhịp nữa trên cùng một con số là
 * cách đối soát không bao giờ ra 0.
 */
export function referralDiscountVnd(input: {
  listSubtotalVnd: number;
  subtotalVnd: number;
  eligible: boolean;
}): number {
  const { listSubtotalVnd, subtotalVnd, eligible } = input;
  if (!eligible) return 0;
  if (!Number.isInteger(subtotalVnd) || subtotalVnd <= 0) return 0;
  if (!Number.isInteger(listSubtotalVnd) || listSubtotalVnd < subtotalVnd) return 0;

  const best = Math.round((listSubtotalVnd * REFERRAL_DISCOUNT_PCT) / 100);
  const alreadyDiscounted = listSubtotalVnd - subtotalVnd;
  const topUp = best - alreadyDiscounted;
  if (topUp <= 0) return 0;

  // Cùng một trần với credits, vì cùng một lý do: đơn phải còn trả được.
  return Math.min(topUp, Math.max(0, subtotalVnd - MIN_CHARGE_VND));
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

/** Trần credits cho một lần đăng ký, tính trên học phí của chính lần đó. */
export function maxCreditForTuitionVnd(tuitionVnd: number): number {
  if (!Number.isInteger(tuitionVnd) || tuitionVnd <= 0) return 0;
  return Math.floor((tuitionVnd * CREDIT_MAX_SHARE_PCT) / 100);
}

/**
 * Số credits thực sự được trừ vào một đơn.
 *
 * `wanted` là ý muốn của học viên (checkbox trong giỏ hàng) — trình duyệt chỉ
 * được gửi lên đúng một giá trị bật/tắt, không bao giờ là số tiền.
 *
 * Ba trần cùng lúc, và mỗi trần chặn một chuyện khác nhau:
 *   `balanceVnd`  — không tiêu quá số mình có;
 *   `dueVnd`      — đơn phải còn lại một khoản trả được qua PayOS;
 *   `tuitionVnd`  — chính sách chỉ cho credits gánh 30% học phí một lần đăng ký.
 *
 * PHẢI gọi bên trong transaction đã khóa hàng user, nếu không hai tab checkout
 * song song sẽ cùng đọc một số dư và cùng tiêu hết nó.
 */
export function creditToApply(input: {
  balanceVnd: number;
  dueVnd: number;
  tuitionVnd: number;
  wanted: boolean;
}): number {
  if (!input.wanted) return 0;
  if (!Number.isInteger(input.balanceVnd) || input.balanceVnd <= 0) return 0;
  if (!Number.isInteger(input.dueVnd) || input.dueVnd <= 0) return 0;

  const headroom = Math.max(0, input.dueVnd - MIN_CHARGE_VND);
  const cap = maxCreditForTuitionVnd(input.tuitionVnd);
  return Math.max(0, Math.min(input.balanceVnd, headroom, cap));
}

/**
 * Cộng tháng theo lịch, kẹp về ngày cuối tháng khi tháng đích ngắn hơn.
 *
 * `setMonth` trần cho 31/08 + 6 tháng ra 03/03 (tràn sang tháng sau) — một hạn
 * dùng nhảy sang tháng khác là thứ không giải thích được với người đang nhìn
 * số dư của mình.
 */
function addMonths(from: Date, months: number): Date {
  const result = new Date(from.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

/** Thời điểm một khoản hoa hồng ghi lúc `now` bắt đầu tiêu được. */
export function commissionAvailableAt(now: Date): Date {
  return new Date(now.getTime() + COMMISSION_HOLD_DAYS * 24 * 3600 * 1000);
}

/** Thời điểm một khoản hoa hồng ghi lúc `now` hết hạn. */
export function commissionExpiresAt(now: Date): Date {
  return addMonths(now, CREDIT_TTL_MONTHS);
}

/** Mốc bắt đầu của cửa sổ trượt đếm số lượt giới thiệu được thưởng. */
export function rewardWindowStart(now: Date): Date {
  return addMonths(now, -REWARD_WINDOW_MONTHS);
}
