"use client";

import { usePathname } from "next/navigation";
import { CtaLink } from "./ui/cta-link";
import { IconMessage } from "./ui/icons";
import { buttonClass } from "@/components/ui/button";

/**
 * Lời mời "Đặt lịch tư vấn" ở đầu footer, trên chính dải navy — không còn là
 * thẻ nổi đè lên mép footer. Trang chủ (mục Liên hệ) và /khoa-hoc (khối
 * "Chưa chắc khóa học nào phù hợp với bạn?") đã kết bằng lời mời riêng ngay
 * phía trên nên ẩn ở đó để không lặp lời mời.
 */
const PAGES_WITH_OWN_INVITE = new Set(["/", "/khoa-hoc"]);
export function FooterCtaCard() {
  const pathname = usePathname();
  if (PAGES_WITH_OWN_INVITE.has(pathname)) return null;

  return (
    <div className="shell flex flex-col gap-6 py-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-xl">
        <h2 className="text-2xl leading-tight font-bold tracking-[-0.02em] text-white sm:text-3xl">
          Đặt lịch tư vấn miễn phí
        </h2>
        <p className="mt-2 text-base text-white/80">
          Một buổi trò chuyện để bàn về đề tài và hướng công bố phù hợp với bạn.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <CtaLink
          source="footer"
          target="zalo"
          className={buttonClass({ variant: "onBand", size: "lg" })}
        >
          <IconMessage size={18} />
          Nhắn Zalo
        </CtaLink>
        <CtaLink
          source="footer"
          target="tu-van"
          className={buttonClass({
            size: "lg",
            className: "border border-white/60 bg-transparent text-white hover:bg-white/10",
          })}
        >
          Các kênh liên hệ khác
        </CtaLink>
      </div>
    </div>
  );
}
