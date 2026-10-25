"use client";

import { usePathname } from "next/navigation";
import { CtaLink } from "./ui/cta-link";
import { IconArrow, IconMessage } from "./ui/icons";
import { Notation } from "./ui/notation";

/**
 * Thẻ "Đặt lịch tư vấn" nổi, đè lên mép trên footer (mượn thẻ newsletter của
 * Analyst Academy). Trang chủ đã có mục Liên hệ ngay phía trên footer nên ẩn
 * thẻ ở đó để không lặp lời mời.
 */
export function FooterCtaCard() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="shell relative z-10 -mt-12 mb-12">
      <div className="flex flex-col gap-6 rounded-[18px] border border-line bg-card p-6 text-fg shadow-[0_2px_100px_rgba(12,73,143,0.18)] sm:p-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Đặt lịch <Notation type="underline">tư vấn</Notation> miễn phí
          </h2>
          <p className="mt-2 text-base text-fg-muted">
            Một buổi trò chuyện để bàn về đề tài và hướng công bố phù hợp với bạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CtaLink
            source="footer"
            target="tu-van"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition-colors hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Đặt lịch tư vấn
            <IconArrow size={16} />
          </CtaLink>
          <CtaLink
            source="footer"
            target="zalo"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3 text-sm font-bold text-fg transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <IconMessage size={16} />
            Nhắn Zalo
          </CtaLink>
        </div>
      </div>
    </div>
  );
}
