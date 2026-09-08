import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  conferenceProgram,
  conferenceProgramIntro,
  type ConferenceForum,
} from "@/content/conference-program";
import { site } from "@/content/site";
import { Badge } from "@/components/ui/badge";
import { CtaLink } from "@/components/ui/cta-link";
import { IconArrow, IconCheck } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = {
  title: `Hội thảo quốc tế & cơ hội xuất bản — ${site.name}`,
  description: conferenceProgramIntro.subtitle,
  alternates: { canonical: "/hoi-thao-quoc-te" },
};

/**
 * Chương trình HDI đồng hành hội thảo quốc tế, tách khỏi trang chủ. Trang chủ chỉ
 * giữ teaser hai thẻ (components/sections/conference-program.tsx) và link vào đây.
 */
export default function ConferenceProgramPage() {
  const { lead, benefits, forums, advisor, process, images } = conferenceProgram;

  return (
    <>
      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {conferenceProgramIntro.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {conferenceProgramIntro.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-fg-muted sm:text-lg">
            {conferenceProgramIntro.subtitle}
          </p>
        </div>
      </section>

      <div className="relative h-[220px] w-full border-b border-line bg-bg sm:h-[300px] lg:h-[400px]">
        <Image
          src={images.hero.src}
          alt={images.hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <Section>
        <SectionHeading eyebrow="Đồng hành nghiên cứu" title="HDI đồng hành cùng bạn" />
        <Reveal>
          <p className="max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {lead}
          </p>
          <p className="mt-6 text-sm font-semibold text-fg">
            Dưới hướng dẫn của Dr. Tâm Trịnh, học viên được hỗ trợ:
          </p>
          <CheckList items={benefits} columns />
        </Reveal>
      </Section>

      <ForumSection forum={forums[0]} soft />
      <ForumSection forum={forums[1]} />

      <Section soft>
        <SectionHeading
          eyebrow="Người hướng dẫn"
          title="Đồng hành cùng Dr. Tâm Trịnh"
          subtitle="Kinh nghiệm học thuật — hướng dẫn thực chất — kết nối quốc tế."
        />
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="space-y-4 text-base leading-relaxed text-fg-muted">
              {advisor.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {advisor.roles.map((role) => (
                <Badge key={role}>{role}</Badge>
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-fg">{advisor.since}</p>
            <Link
              href="/cong-bo"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              Xem hồ sơ học thuật đầy đủ
              <IconArrow size={15} />
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <Image
              src={images.advisor.src}
              alt={images.advisor.alt}
              width={1600}
              height={1067}
              sizes="(min-width: 1024px) 480px, 100vw"
              className="h-auto w-full rounded-card border border-line object-cover"
            />
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Quy trình"
          title="Quy trình đồng hành"
          subtitle="Bảy bước từ đánh giá đề tài đến tư vấn hướng gửi xuất bản."
        />
        <Reveal>
          <ol className="overflow-hidden rounded-card border border-line bg-card">
            {process.map((step, index) => (
              <li
                key={step.title}
                className="grid gap-1 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-[auto_1fr] sm:items-baseline sm:gap-5 sm:px-6 sm:py-5"
              >
                <span className="text-sm font-bold tabular-nums text-fg-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[15px] font-semibold leading-snug text-fg">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>

      <Section soft>
        <Reveal>
          <div className="rounded-card border border-line bg-card p-7 sm:p-9">
            <h2 className="text-2xl font-bold text-fg sm:text-3xl">
              Sẵn sàng cho hội thảo quốc tế đầu tiên?
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
              Đặt lịch tư vấn để HDI đánh giá mức độ sẵn sàng của đề tài và cùng
              bạn chọn giữa AGBA, EBES hoặc hướng công bố phù hợp.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaLink
                source="hoi-thao-quoc-te"
                target="tu-van"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                Đăng ký tư vấn lộ trình hội thảo
                <IconArrow size={15} />
              </CtaLink>
              <Link
                href="/khoa-hoc"
                className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                Xem khóa học nền tảng
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}

function ForumSection({
  forum,
  soft = false,
}: {
  forum: ConferenceForum;
  soft?: boolean;
}) {
  return (
    <Section id={forum.id} soft={soft}>
      <SectionHeading eyebrow={forum.eyebrow} title={forum.name} />

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <Reveal>
          <div className="space-y-4 text-base leading-relaxed text-fg-muted">
            {forum.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <a
            href={forum.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Trang chính thức
            <IconArrow size={15} />
          </a>
        </Reveal>

        <Reveal delay={80}>
          <ul className="space-y-2">
            {forum.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-card border border-line bg-card px-4 py-3 text-sm leading-relaxed text-fg-muted"
              >
                <IconCheck size={15} className="mt-0.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <h3 className="mt-10 text-lg font-bold text-fg">Hướng phát triển công bố</h3>
      <Reveal>
        <ol className="mt-4 overflow-hidden rounded-card border border-line bg-card">
          {forum.outlets.map((outlet) => (
            <li
              key={outlet.name}
              className="grid gap-1 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-5 sm:px-6 sm:py-5"
            >
              <div>
                <p className="text-[15px] font-semibold leading-snug text-fg">
                  {outlet.name}
                </p>
                <p className="mt-1 text-sm text-fg-muted">{outlet.publisher}</p>
              </div>
              <div className="sm:text-right">
                <Badge>{outlet.standing}</Badge>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal>
        <p className="mt-4 rounded-card border border-line bg-tint px-4 py-3 text-sm leading-relaxed text-fg-muted">
          <span className="font-semibold text-fg">Lưu ý về xếp hạng. </span>
          {forum.note}
        </p>
      </Reveal>

      <h3 className="mt-10 text-lg font-bold text-fg">
        HDI đồng hành cùng người tham dự
      </h3>
      <Reveal>
        <CheckList items={forum.accompany} columns />
      </Reveal>

      <Reveal>
        <p className="mt-8 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm leading-relaxed text-fg-subtle">
          <span className="font-semibold text-fg-muted">Miễn trừ. </span>
          {forum.disclaimer}
        </p>
      </Reveal>
    </Section>
  );
}

function CheckList({
  items,
  columns = false,
}: {
  items: readonly string[];
  columns?: boolean;
}) {
  return (
    <ul className={`mt-5 grid gap-3 ${columns ? "sm:grid-cols-2" : ""}`}>
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-sm leading-relaxed text-fg-muted"
        >
          <IconCheck size={15} className="mt-0.5 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
