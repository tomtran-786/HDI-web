import Image from "next/image";
import Link from "next/link";
import { about } from "@/content/about";
import { IconArrow } from "../ui/icons";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

/** Bản giới thiệu ngắn; toàn bộ mô hình và đội ngũ nằm tại /ve-hdi. */
export function About() {
  return (
    <Section id="ve-chung-toi">
      <SectionHeading
        eyebrow={about.eyebrow}
        title={about.title}
        subtitle={about.subtitle}
      />

      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div className="space-y-5 text-base leading-relaxed text-fg-muted sm:text-[17px]">
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

        <Reveal delay={100}>
          <Image
            src={about.illustration.src}
            alt=""
            aria-hidden
            // Không đi qua image optimizer: SVG phải được phục vụ nguyên bản
            // để các thẻ animate/animateTransform bên trong tiếp tục chạy.
            unoptimized
            width={560}
            height={560}
            sizes="(min-width: 1024px) 560px, (min-width: 640px) 384px, calc(100vw - 3rem)"
            className="mx-auto h-auto w-full max-w-sm lg:max-w-none"
          />
        </Reveal>
      </div>
    </Section>
  );
}
