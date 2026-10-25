import Link from "next/link";
import { about } from "@/content/about";
import { ConferenceMap } from "../conference-map";
import { IconArrow } from "../ui/icons";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

/** Bản giới thiệu ngắn; toàn bộ mô hình và đội ngũ nằm tại /ve-hdi. */
export function About({ soft }: { soft?: boolean }) {
  return (
    <Section id="ve-chung-toi" soft={soft}>
      <SectionHeading
        eyebrow={about.eyebrow}
        title={about.title}
        mark={{ text: "HDI Research Center" }}
        subtitle={about.subtitle}
      />

      <Reveal>
        <div className="max-w-3xl space-y-5 text-base leading-relaxed text-fg-muted sm:text-[17px]">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link
          href="/ve-hdi"
          className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          Tìm hiểu thêm về HDI Research Center
          <IconArrow size={15} />
        </Link>
      </Reveal>

      {/* Bản đồ 14 lần trình bày ở 11 quốc gia — dữ liệu thật từ
          content/conferences.ts, thay cho ảnh minh họa trước đây. */}
      <Reveal delay={100} className="mt-12 sm:mt-14">
        <ConferenceMap />
      </Reveal>
    </Section>
  );
}
