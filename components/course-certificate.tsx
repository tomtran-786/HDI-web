import { certificate } from "@/content/certificate";
import { CertificateViewer } from "./certificate-viewer";
import { Card } from "./ui/card";
import { CheckDot } from "./ui/check-dot";
import { IconAward } from "./ui/icons";
import { Reveal } from "./ui/reveal";
import { Section, SectionHeading } from "./ui/section";

/**
 * Một dòng dưới danh sách "Khóa học gồm" ở card học phí: báo trước khi bấm đăng
 * ký rằng học xong có giấy chứng nhận, kèm link nhảy tới khối ảnh mẫu. Không
 * nằm trong `facts` vì bộ sáu nhãn `FACT_LABELS` được khóa bằng type; cả bảy
 * khóa đều cấp chứng nhận nên dòng này giống hệt nhau ở mọi khóa.
 */
export function CertificateNote() {
  return (
    <p className="mt-3 flex gap-3 text-[15px] leading-snug text-fg">
      <IconAward className="shrink-0 text-primary" size={19} />
      <span className="min-w-0">
        {certificate.note.text}{" "}
        <span className="whitespace-nowrap">
          ·{" "}
          <a
            href={`#${certificate.sectionId}`}
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            {certificate.note.link}
          </a>
        </span>
      </span>
    </p>
  );
}

/** Khối ảnh mẫu giấy chứng nhận, đặt sau "Lộ trình học" ở trang chi tiết khóa. */
export function CertificateSection({ soft = false }: { soft?: boolean }) {
  return (
    <Section id={certificate.sectionId} soft={soft}>
      <SectionHeading
        eyebrow={certificate.eyebrow}
        title={certificate.title}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
        <Reveal>
          <Card className="p-3 sm:p-4" hover={false}>
            <CertificateViewer />
          </Card>
          <p className="mt-3 text-sm leading-relaxed text-fg-subtle">
            {certificate.caption}
          </p>
        </Reveal>
        <Reveal delay={80}>
          <ul className="space-y-5">
            {certificate.points.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-base leading-relaxed text-fg-muted sm:text-lg"
              >
                <CheckDot />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
