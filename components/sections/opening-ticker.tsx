import type { CSSProperties } from "react";
import Link from "next/link";
import type { OpeningAnnouncement } from "@/lib/courses";
import { IconCalendar } from "../ui/icons";

/**
 * Dải lịch khai giảng chạy ngang, đặt ngay trên #khoa-hoc.
 *
 * TOÀN BỘ chiều rộng màn hình, nên KHÔNG dùng <Section> — <Section> gắn cứng một
 * `shell` (max-width 76rem) bên trong. Đây là cùng lối đi mà `Hero` dùng: một
 * <section> trần, tự viết lấy đường kẻ `border-line`.
 *
 * Chỉ `border-t`, KHÔNG `border-y`: <Section id="khoa-hoc"> ngay dưới đã có
 * `border-t border-line` của riêng nó, thêm `border-b` ở đây là hai hairline
 * chồng lên nhau thành một vạch 2px.
 *
 * Bản sao thứ hai của danh sách là thứ làm vòng lặp liền mạch (xem @keyframes
 * ticker-scroll trong app/globals.css). Nó `aria-hidden` và các liên kết trong
 * đó mang `tabIndex={-1}` — một phần tử focus được nằm trong vùng aria-hidden là
 * lỗi thật, trình đọc màn hình mất dấu con trỏ, chứ không phải chuyện thẩm mỹ.
 */
export function OpeningTicker({ items }: { items: OpeningAnnouncement[] }) {
  if (items.length === 0) return null;

  // Nhóm dài ra theo số mục, nên thời lượng phải dài theo thì TỐC ĐỘ đọc mới
  // không đổi — ~18 giây cho mỗi mục, cộng một khoảng nền.
  const seconds = 18 * items.length + 18;

  const group = (echo: boolean) => (
    <ul
      className={`ticker-group${echo ? " ticker-echo" : ""}`}
      aria-hidden={echo || undefined}
    >
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/khoa-hoc/${item.slug}`}
            tabIndex={echo ? -1 : undefined}
            className="ticker-link inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[13px] leading-6 text-fg-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-tint sm:text-sm"
          >
            <span>Khai giảng</span>
            <time
              dateTime={item.startDate}
              className="font-bold tabular-nums text-primary"
            >
              {item.dateLabel}
            </time>
            <span aria-hidden className="text-fg-subtle">
              ·
            </span>
            <span className="font-semibold text-fg">{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      data-ticker
      aria-label="Lịch khai giảng các khóa đang mở đăng ký"
      className="border-t border-line bg-tint text-fg"
    >
      <div className="flex items-center gap-2 py-1.5 pl-3 pr-2 sm:gap-3 sm:pl-5 sm:pr-4">
        {/* Nhãn nhìn thấy được; tên của vùng đã nằm ở `aria-label` bên trên nên
            khối này aria-hidden để trình đọc màn hình không đọc hai lần. */}
        <p
          aria-hidden
          className="flex shrink-0 items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-primary"
        >
          <IconCalendar size={16} />
          <span className="hidden sm:inline">Lịch khai giảng</span>
        </p>

        <div
          className="ticker-viewport"
          style={{ "--ticker-duration": `${seconds}s` } as CSSProperties}
        >
          <div className="ticker-track">
            {group(false)}
            {group(true)}
          </div>
        </div>
      </div>
    </section>
  );
}
