import { composeEmailHref, contact, links } from "@/content/site";
import { buttonClass } from "../ui/button";
import { CtaLink } from "../ui/cta-link";
import { Section } from "../ui/section";
import { IconMail, IconMessage, IconPhone } from "../ui/icons";

const elsewhere = [
  { label: "Facebook", href: links.fanpage },
  { label: "Linktree", href: links.linktree },
  { label: "TikTok", href: links.tiktok },
];

/**
 * Phần kết của trang chủ: lời mời tư vấn trên dải navy, ba kênh liên hệ.
 * `phoneNote` khuyên dùng Zalo nên Zalo là nút chính.
 */
export function Contact() {
  return (
    <Section id="lien-he" tone="band">
      <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <h2 className="text-[1.875rem] leading-[1.15] font-bold tracking-[-0.02em] sm:text-4xl lg:text-[2.625rem]">
            Đặt lịch tư vấn
          </h2>
          <p className="mt-3 max-w-[52ch] text-lg text-white/85">
            Một buổi trò chuyện miễn phí để bàn về đề tài của bạn. Số suất mỗi
            tháng có giới hạn để mỗi học viên đều được theo sát — hãy nhắn trước
            để giữ chỗ.
          </p>
        </div>
        <div>
          <div className="flex flex-wrap gap-3">
            <CtaLink
              source="lien-he"
              target="zalo"
              className={buttonClass({ variant: "onBand", size: "lg" })}
            >
              <IconMessage size={18} />
              Nhắn Zalo
            </CtaLink>
            <a
              href={contact.phoneHref}
              className={buttonClass({
                size: "lg",
                className: "border border-white/60 bg-transparent text-white hover:bg-white/10",
              })}
            >
              <IconPhone size={18} />
              {contact.phone}
            </a>
            <a
              href={composeEmailHref()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({
                size: "lg",
                className: "border border-white/60 bg-transparent text-white hover:bg-white/10",
              })}
            >
              <IconMail size={18} />
              {contact.email}
            </a>
          </div>
          <p className="mt-4 text-sm text-white/75">
            {contact.phoneNote}
            {elsewhere.map(({ label, href }) => (
              <span key={label}>
                <span aria-hidden className="px-2 text-white/40">
                  ·
                </span>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-white/40 underline-offset-4 hover:decoration-white"
                >
                  {label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </Section>
  );
}
