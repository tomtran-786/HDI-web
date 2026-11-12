import { faqItems } from "@/content/faq";
import { IconChevronDown } from "../ui/icons";
import { Section, SectionHeading } from "../ui/section";

/**
 * Câu hỏi thường gặp. Hình thức: tiêu đề đứng yên ở cột trái trên màn rộng,
 * các câu hỏi là danh sách kẻ ở cột phải — không bọc trong thẻ.
 */
export function Faq() {
  return (
    <Section id="faq">
      <div className="grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            title="Câu hỏi thường gặp"
            subtitle="Về khóa học, dịch vụ, hình thức học và quy trình đăng ký tại HDI."
          />
        </div>
        <div className="border-t-2 border-rule">
          {faqItems.map((item) => (
            <details key={item.question} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-[1.0625rem] font-semibold text-fg transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <IconChevronDown
                  size={18}
                  className="mt-1 shrink-0 text-fg-subtle transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="max-w-[64ch] pr-8 pb-5 leading-relaxed text-fg-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
