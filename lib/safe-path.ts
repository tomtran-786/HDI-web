/**
 * Where to send someone after they sign in or finish their profile.
 *
 * The value arrives from a query string or a form field, so it is attacker
 * controlled. Anything that is not a plain path on this site is discarded in
 * favour of the fallback — in particular `//evil.example`, which a browser
 * reads as a protocol-relative URL and would happily follow off-site. That is
 * the whole open-redirect bug, and it exists precisely because `//evil` does
 * start with "/".
 */
export function safeNext(
  value: FormDataEntryValue | string | string[] | undefined | null,
  fallback = "/tai-khoan",
) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  // Backslashes: some browsers normalise "/\evil.example" to "//evil.example".
  if (raw.includes("\\")) return fallback;
  // Ký tự điều khiển, vì cùng lý do với hai dòng trên nhưng khó thấy hơn:
  // trình duyệt bỏ tab, CR và LF khi phân tích URL, nên "/<TAB>/evil.example"
  // qua được cả ba lớp kiểm tra ở trên rồi trở thành "//evil.example" đúng lúc
  // nó được đi theo. Tab lại là ký tự hợp lệ trong header value nên không có
  // tầng nào phía dưới chặn hộ.
  if (/[\u0000-\u001F\u007F]/.test(raw)) return fallback;
  return raw;
}
