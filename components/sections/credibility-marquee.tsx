import Image from "next/image";
import Link from "next/link";
import {
  conferenceLogos,
  publisherLogos,
  type CredibilityLogo,
} from "@/content/credibility-logos";
import { conferences } from "@/content/conferences";
import { publications } from "@/content/publications";

/** "Energy Economics, 109456" → "Energy Economics": bỏ volume, số, trang. */
export function venueName(venue: string) {
  return venue.split(/,\s*(?=\d|pp?\.)/)[0].trim();
}

/** Tên tạp chí đã đăng bài, theo thứ tự xuất hiện trong content/publications.ts. */
export const journalNames = [
  ...new Set(publications.map((publication) => venueName(publication.venue))),
];

/** Hội thảo, đơn vị đã mời trình bày (không trùng) — dùng để đối chiếu với logo. */
export const conferenceNames = [
  ...new Set(conferences.map((conference) => conference.short)),
];

/** Thời gian chạy mỗi logo: 5 logo → 30s cho một vòng, hàng dài thì lâu hơn. */
const SECONDS_PER_LOGO = 6;
/** Số lần lặp mỗi hàng để dải luôn đủ rộng cho màn hình lớn. */
const REPEATS = { short: 4, long: 3 } as const;

function LogoImage({ logo }: { logo: CredibilityLogo }) {
  return (
    <Image
      src={logo.src}
      alt={logo.name}
      width={logo.width}
      height={logo.height}
      unoptimized={logo.src.endsWith(".svg")}
      // Logo nằm ngoài màn hình theo chiều ngang nên lazy-load sẽ để lộ ô trống
      // khi dải chạy tới; cùng một URL được dùng lại ở mọi bản lặp.
      loading="eager"
      sizes={`${Math.ceil((logo.display * logo.width) / logo.height)}px`}
      style={{ height: logo.display, width: "auto" }}
      className={`marquee-logo ${logo.whiteOnly ? "marquee-logo-white" : ""}`}
    />
  );
}

/**
 * Một hàng chạy. Bộ logo đầu nằm trong `<ul>` mà trình đọc màn hình đọc; các
 * bản lặp phía sau chỉ để vòng lặp liền mạch nên `aria-hidden`. Hết
 * `prefers-reduced-motion` thì bản lặp ẩn đi và hàng xuống dòng thành lưới tĩnh.
 */
function MarqueeRow({
  items,
  direction,
  repeats,
}: {
  items: readonly { key: string; logo: CredibilityLogo; detail?: string }[];
  direction: "left" | "right";
  repeats: number;
}) {
  return (
    <div className="marquee-mask">
      <div
        className="marquee-track"
        data-direction={direction}
        style={
          {
            "--marquee-duration": `${items.length * SECONDS_PER_LOGO}s`,
            "--marquee-shift": `-${100 / repeats}%`,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: repeats }, (_, copy) => (
          <ul
            key={copy}
            aria-hidden={copy > 0 || undefined}
            data-marquee-copy={copy > 0 || undefined}
            className="flex shrink-0 items-center gap-x-14 pr-14 motion-reduce:flex-wrap motion-reduce:gap-y-4"
          >
            {items.map(({ key, logo, detail }) => (
              <li
                key={key}
                className="marquee-chip flex shrink-0 items-center"
              >
                <LogoImage logo={logo} />
                {copy === 0 && detail && (
                  <span className="sr-only">{`: ${detail}`}</span>
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

const publisherItems = publisherLogos.map((publisher) => ({
  key: publisher.name,
  logo: publisher,
  detail: publisher.journals.join(", "),
}));

const conferenceItems = conferenceLogos.map((conference) => ({
  key: conference.short,
  logo: conference,
}));

/**
 * Dải chạy dưới cùng của hero: logo nhà xuất bản của các tạp chí đã đăng bài
 * (chạy sang trái) và logo hội thảo, trường đại học đã trình bày (chạy sang
 * phải). Logo hiển thị xám, hiện màu khi rê chuột (globals.css); danh sách tạp
 * chí nằm trong chữ ẩn cho trình đọc màn hình.
 *
 * Dừng khi hover hoặc khi link "Xem hồ sơ học thuật" nhận focus bàn phím
 * (`:focus-within`); không có nút tạm dừng riêng.
 */
export function CredibilityMarquee() {
  return (
    <div data-marquee className="border-t border-line">
      <div className="shell flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Công bố &amp; trình bày tại
        </p>
        <Link
          href="/cong-bo"
          className="rounded-sm text-xs font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Xem hồ sơ học thuật →
        </Link>
      </div>
      <div className="space-y-4 py-6">
        <MarqueeRow
          items={publisherItems}
          direction="left"
          repeats={REPEATS.short}
        />
        <MarqueeRow
          items={conferenceItems}
          direction="right"
          repeats={REPEATS.long}
        />
      </div>
    </div>
  );
}
