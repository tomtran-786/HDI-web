import type { Course } from "@/content/course";
import { courseExpect } from "@/content/course-expect";
import { buttonClass } from "./ui/button";
import { Reveal } from "./ui/reveal";
import { Section } from "./ui/section";

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
          <h2 className="text-[1.875rem] leading-[1.15] font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-[2.625rem]">
            {courseExpect.title}
          </h2>
          <a
            href={`#${priceCardId}`}
            className={buttonClass({ variant: "onBand", size: "lg", className: "mt-8" })}
          >
            {buyable ? courseExpect.cta.open : courseExpect.cta.closed}
          </a>
        </Reveal>

        <Reveal delay={100}>
          <div
            role="group"
            aria-label={courseExpect.deckLabel}
            className="relative mx-auto max-w-md px-3 py-4"
          >
            <div className="on-white relative rounded-card p-6 shadow-md sm:p-7">
            <p className="border-b-2 border-rule pb-2 text-base font-bold">{courseExpect.eyebrow}</p>
            <ol className="mt-5 space-y-5">
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
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
