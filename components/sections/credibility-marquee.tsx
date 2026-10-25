import Link from "next/link";
import { conferences } from "@/content/conferences";
import { publications } from "@/content/publications";

/** "Energy Economics, 109456" → "Energy Economics": bỏ volume, số, trang. */
export function venueName(venue: string) {
  return venue.split(/,\s*(?=\d|pp?\.)/)[0].trim();
}

const unique = (names: string[]) => [...new Set(names)];

/** Tên tạp chí đã đăng bài, theo thứ tự xuất hiện trong content/publications.ts. */
export const journalNames = unique(
  publications.map((publication) => venueName(publication.venue)),
);

/** Hội thảo và đơn vị đã mời trình bày, theo content/conferences.ts. */
export const conferenceNames = unique(
  conferences.map((conference) => conference.short),
);

const rowLabel = "Công bố & trình bày tại";

/**
 * Một hàng chạy. Danh sách thật nằm trong `<ul>` đầu; bản sao thứ hai chỉ để
 * vòng lặp liền mạch nên `aria-hidden`. Hết `prefers-reduced-motion` thì bản sao
 * ẩn đi và hàng xuống dòng thành danh sách tĩnh.
 */
function MarqueeRow({
  items,
  direction,
}: {
  items: string[];
  direction: "left" | "right";
}) {
  return (
    <div className="marquee-mask">
      <div className="marquee-track" data-direction={direction}>
        {[false, true].map((copy) => (
          <ul
            key={String(copy)}
            aria-hidden={copy || undefined}
            data-marquee-copy={copy || undefined}
            className="flex shrink-0 gap-x-10 pr-10 motion-reduce:flex-wrap motion-reduce:gap-y-2"
          >
            {items.map((name) => (
              <li
                key={name}
                className="whitespace-nowrap text-sm font-semibold uppercase tracking-[0.08em] text-fg-subtle"
              >
                {name}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/**
 * Dải chạy dưới cùng của hero: tên tạp chí (chạy sang trái) và hội thảo, đơn
 * vị (chạy sang phải). Chỉ là wordmark bằng chữ — không logo, để không gợi ý
 * quan hệ đối tác nào ngoài việc đã công bố hoặc trình bày ở đó.
 *
 * Dừng khi hover hoặc khi link "Xem hồ sơ học thuật" nhận focus bàn phím
 * (`:focus-within`, globals.css); không có nút tạm dừng riêng.
 */
export function CredibilityMarquee() {
  return (
    <div data-marquee className="border-t border-line">
      <div className="shell flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {rowLabel}
        </p>
        <Link
          href="/cong-bo"
          className="rounded-sm text-xs font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Xem hồ sơ học thuật →
        </Link>
      </div>
      <div className="space-y-3 py-5">
        <MarqueeRow items={journalNames} direction="left" />
        <MarqueeRow items={conferenceNames} direction="right" />
      </div>
    </div>
  );
}
