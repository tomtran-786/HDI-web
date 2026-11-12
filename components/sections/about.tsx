import Link from "next/link";
import { about } from "@/content/about";
import { ConferenceMap } from "../conference-map";
import { Section, SectionHeading } from "../ui/section";

/**
 * Bản giới thiệu ngắn; toàn bộ mô hình và đội ngũ nằm tại /ve-hdi.
 *
 * Hình thức: đoạn đầu đặt cỡ lớn như lời mở của cuốn chương trình, các đoạn
 * sau ở cỡ thân bài, rồi bản đồ 14 lần trình bày ở 11 quốc gia (dữ liệu thật
 * từ content/conferences.ts) trải hết chiều ngang.
 */
export function About() {
  const [opening, ...rest] = about.paragraphs;

  return (
    <Section id="ve-chung-toi">
      <div className="grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <SectionHeading title={about.title} subtitle={about.subtitle} />
        <div className="max-w-[62ch]">
          <p className="text-xl leading-relaxed text-fg sm:text-[1.375rem]">{opening}</p>
          {rest.map((paragraph) => (
            <p key={paragraph} className="mt-5 leading-relaxed text-fg-muted">
              {paragraph}
            </p>
          ))}
          <Link
            href="/ve-hdi"
            className="mt-6 inline-block text-[0.9375rem] font-semibold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Tìm hiểu thêm về {about.title.replace(/^Về /, "")}
          </Link>
        </div>
      </div>

      <div className="mt-12 sm:mt-14">
        <ConferenceMap />
      </div>
    </Section>
  );
}
