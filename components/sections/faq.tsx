import { faqItems } from "@/content/faq";
import { Card } from "../ui/card";
import { IconChevronDown } from "../ui/icons";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading
        eyebrow="Câu hỏi thường gặp"
        title="Những điều bạn có thể muốn biết trước khi bắt đầu"
        subtitle="Thông tin về khóa học, dịch vụ, hình thức học và quy trình đăng ký tại HDI."
      />

      <Reveal>
        <Card className="mx-auto max-w-4xl overflow-hidden" hover={false}>
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group border-b border-line px-5 last:border-b-0 sm:px-7"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-base font-bold text-fg transition hover:text-primary [&::-webkit-details-marker]:hidden sm:py-6 sm:text-lg">
                <span>{item.question}</span>
                <IconChevronDown
                  size={18}
                  className="shrink-0 text-primary transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="max-w-3xl pb-5 pr-8 text-sm leading-relaxed text-fg-muted sm:pb-6 sm:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </Card>
      </Reveal>
    </Section>
  );
}
