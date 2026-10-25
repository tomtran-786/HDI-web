import type { Course } from "@/content/course";
import { courseExpect } from "@/content/course-expect";
import { IconArrow } from "./ui/icons";
import { Reveal } from "./ui/reveal";
import { MarkedTitle, Section } from "./ui/section";

/**
 * Band navy "Điều bạn nhận được" — bản HDI của band "What to expect" ở
 * Analyst Academy. Bên phải là "chồng bản thảo": ba tờ giấy xếp nghiêng, tờ
 * trên cùng liệt kê những kết quả đầu tiên của chính khóa này, hiện lần lượt
 * cách nhau 150ms khi cuộn tới (`.deck-row` trong globals.css).
 *
 * Nút dẫn về card học phí (`#hoc-phi`) và cố ý KHÔNG dùng chữ "Đăng ký học khóa
 * này" — chữ đó chỉ được xuất hiện ở đúng một nút trên trang.
 */
export function CourseExpectBand({
  course,
  buyable,
  priceCardId,
}: {
  course: Course;
  buyable: boolean;
  priceCardId: string;
}) {
  const outcomes = course.outcomes.slice(0, courseExpect.outcomeCount);

  return (
    <Section tone="band">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent-on-band">
            {courseExpect.eyebrow}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1]">
            <MarkedTitle
              title={courseExpect.title}
              mark={{ text: courseExpect.mark }}
            />
          </h2>
          <a
            href={`#${priceCardId}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0c498f] transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-on-band focus-visible:ring-offset-2 focus-visible:ring-offset-(color:--band-from)"
          >
            {buyable ? courseExpect.cta.open : courseExpect.cta.closed}
            <IconArrow size={16} />
          </a>
        </Reveal>

        <Reveal delay={100}>
          <div
            role="group"
            aria-label={courseExpect.deckLabel}
            className="relative mx-auto max-w-md px-3 py-4"
          >
            <div
              aria-hidden
              className="absolute inset-x-3 inset-y-4 -rotate-[6.5deg] rounded-card bg-white/55 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)]"
            />
            <div
              aria-hidden
              className="absolute inset-x-3 inset-y-4 -rotate-[4.2deg] rounded-card bg-white/80 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)]"
            />
            <ol className="on-white relative -rotate-2 space-y-5 rounded-card p-6 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.65)] sm:p-7">
              {outcomes.map((outcome, index) => (
                <li
                  key={outcome}
                  className="deck-row flex gap-3.5 text-[15px] leading-relaxed text-fg"
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <span>{outcome}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
