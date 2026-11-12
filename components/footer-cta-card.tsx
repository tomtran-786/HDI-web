"use client";

import { usePathname } from "next/navigation";
import { CtaLink } from "./ui/cta-link";
import { IconArrow, IconMessage } from "./ui/icons";
import { Notation } from "./ui/notation";
import { buttonClass } from "@/components/ui/button";

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
      <div className="flex flex-col gap-6 rounded-[18px] border border-line bg-card p-6 text-fg shadow-md sm:p-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Đặt lịch tư vấn <Notation type="underline">miễn phí</Notation>
          </h2>
          <p className="mt-2 text-base text-fg-muted">
            Một buổi trò chuyện để bàn về đề tài và hướng công bố phù hợp với bạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CtaLink
            source="footer"
            target="tu-van"
            className={buttonClass({ size: "lg" })}
          >
            Đặt lịch tư vấn
            <IconArrow size={16} />
          </CtaLink>
          <CtaLink
            source="footer"
            target="zalo"
            className={buttonClass({ variant: "secondary", size: "lg" })}
          >
            <IconMessage size={16} />
            Nhắn Zalo
          </CtaLink>
        </div>
      </div>
    </div>
  );
}
