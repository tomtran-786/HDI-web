/**
 * Shared formatters.
 *
 * All format functions reuse module-level Intl instances: constructing one
 * costs real time, and these run inside list renders. `timeZone` is pinned to
 * Asia/Ho_Chi_Minh so a date reads the same for a student in Hanoi and for a
 * server in Seoul — without it, a 00:30 start date renders as the previous day
 * for half the world.
 */

const dateVN = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

const dateTimeVN = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

const number = new Intl.NumberFormat("vi-VN");

export function formatDate(value: Date) {
  return dateVN.format(value);
}

export function formatDateTime(value: Date) {
  return dateTimeVN.format(value);
}

/** Tuition, always in đồng — the only currency this site quotes. */
export function formatVnd(amount: number) {
  return `${number.format(amount)}đ`;
}

/** Plain counts, grouped with Vietnamese thousands separators. */
export function formatCount(value: number) {
  return number.format(value);
}

/**
 * Biên ngày theo giờ Việt Nam, cho các bộ lọc khoảng ngày.
 *
 * Việt Nam ở UTC+7 cố định và KHÔNG có giờ mùa hè — lần cuối cùng đổi là năm
 * 1975. Nhờ vậy offset viết thẳng vào chuỗi là đúng và ổn định, không cần tra
 * bảng múi giờ: `new Date("2026-08-24T00:00:00+07:00")` cho đúng thời điểm nửa
 * đêm ở Hà Nội.
 *
 * Đây là chỗ dễ sai nhất của một bộ lọc ngày. `new Date("2026-08-24")` được đọc
 * là nửa đêm UTC, tức 07:00 sáng giờ Hà Nội — một bộ lọc "hôm nay" viết theo
 * kiểu đó sẽ nuốt mất bảy tiếng đầu ngày, và không ai nhận ra cho tới lúc một
 * đơn hàng lúc 6 giờ sáng biến mất khỏi báo cáo.
 *
 * Trả `null` khi chuỗi rỗng, sai hình dạng, hoặc là một ngày không tồn tại —
 * người gọi coi `null` là "không lọc theo đầu này".
 */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function dayBoundary(input: unknown, suffix: string): Date | null {
  if (typeof input !== "string" || !ISO_DAY.test(input)) return null;
  const at = new Date(`${input}T${suffix}+07:00`);
  if (Number.isNaN(at.getTime())) return null;
  // Kiểm bằng cách quay ngược lại, KHÔNG chỉ bằng NaN: `new Date` cuộn ngày
  // tràn sang tháng sau thay vì báo lỗi, nên "2026-02-31" cho ra 02/03 một cách
  // im lặng. Một mốc lọc sai lệch hai ngày mà không có dấu hiệu nào là thứ
  // không được phép đi qua.
  return toDayInputVN(at) === input ? at : null;
}

/** Nửa đêm đầu ngày `YYYY-MM-DD` theo giờ Việt Nam. */
export function startOfDayVN(input: unknown): Date | null {
  return dayBoundary(input, "00:00:00.000");
}

/** Mili-giây cuối cùng của ngày `YYYY-MM-DD` theo giờ Việt Nam. */
export function endOfDayVN(input: unknown): Date | null {
  return dayBoundary(input, "23:59:59.999");
}

/** `YYYY-MM-DD` của một thời điểm, theo giờ Việt Nam — để đổ ngược vào input. */
export function toDayInputVN(value: Date): string {
  // en-CA cho ra đúng dạng YYYY-MM-DD, và timeZone lo phần đổi ngày.
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(value);
}
