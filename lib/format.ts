/**
 * Shared formatters.
 *
 * Both are module-level Intl instances: constructing one costs real time, and
 * these run inside list renders. `timeZone` is pinned to Asia/Ho_Chi_Minh so a
 * date reads the same for a student in Hanoi and for a server in Seoul —
 * without it, a 00:30 start date renders as the previous day for half the world.
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
