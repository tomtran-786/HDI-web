import { composeEmailHref, contact, links } from "@/content/site";
import { CtaLink } from "../ui/cta-link";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";
import { IconMail, IconMessage, IconPhone } from "../ui/icons";

export function Contact() {
  return (
    <Section id="lien-he" soft>
      <SectionHeading
        eyebrow="Liên hệ"
        title="Đặt lịch tư vấn"
        subtitle="Một buổi trò chuyện miễn phí để bàn về đề tài của bạn"
      />

      <Reveal>
        <div className="mx-auto max-w-2xl rounded-card border border-line bg-card px-6 py-10 text-center sm:px-10">
          <p className="text-3xl" aria-hidden>
            👋
          </p>
          <h3 className="mt-4 text-2xl font-bold text-fg">Cùng bắt đầu nhé</h3>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-fg-muted">
            Số lượng suất mỗi tháng có giới hạn để đảm bảo mỗi học viên đều được
            theo sát. Hãy nhắn trước để giữ chỗ.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={composeEmailHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              <IconMail size={16} />
              {contact.email}
            </a>
            {/* `phoneNote` tells people to prefer Zalo, so Zalo needs its own
                button — otherwise they have to copy the number by hand. */}
            <CtaLink
              source="lien-he"
              target="zalo"
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              <IconMessage size={16} />
              Nhắn Zalo
            </CtaLink>
            <a
              href={contact.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              <IconPhone size={16} />
              {contact.phone}
            </a>
          </div>
          <p className="mt-3 text-xs text-fg-subtle">{contact.phoneNote}</p>

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-sm text-fg-subtle">
              <a
                className="hover:text-primary"
                href={links.fanpage}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook ↗
              </a>
              <span className="px-2">·</span>
              <a
                className="hover:text-primary"
                href={links.linktree}
                target="_blank"
                rel="noopener noreferrer"
              >
                Linktree ↗
              </a>
              <span className="px-2">·</span>
              <a
                className="hover:text-primary"
                href={links.tiktok}
                target="_blank"
                rel="noopener noreferrer"
              >
                TikTok ↗
              </a>
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
