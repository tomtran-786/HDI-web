import { certificate } from "@/content/certificate";
import { CertificateViewer } from "./certificate-viewer";
import { CheckDot } from "./ui/check-dot";
import { IconAward } from "./ui/icons";
import { Reveal } from "./ui/reveal";
import { Section } from "./ui/section";

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

/**
 * Khối chứng nhận nổi bật, dựng theo mục "Certification" của Analyst Academy:
 * ảnh nghiêng trong khung trắng, hai đốm blur phía sau, huy hiệu tròn đè góc,
 * còn tiêu đề lớn nằm ở cột chữ bên phải chứ không ở trên cả khối.
 *
 * Cột chữ đứng trước trong DOM để thứ tự đọc là tiêu đề → ảnh (và trên mobile
 * chữ lên trước ảnh); từ `lg` trở lên ảnh được kéo sang trái.
 */
export function CertificateSection() {
  return (
    <Section id={certificate.sectionId}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <Reveal className="lg:order-2">
          <h2 className="text-[1.875rem] leading-[1.15] font-bold tracking-[-0.02em] sm:text-4xl lg:text-[2.625rem]">
            {certificate.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-fg-muted sm:text-lg">
            {certificate.lead.map((part, index) =>
              "strong" in part ? (
                <strong key={index} className="font-bold text-fg">
                  {part.text}
                </strong>
              ) : (
                part.text
              ),
            )}
          </p>
          <ul className="mt-6 space-y-4">
            {certificate.points.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-base leading-relaxed text-fg-muted"
              >
                <CheckDot />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={80} className="lg:order-1">
          <div className="rounded-card border border-line bg-white p-3 shadow-sm sm:p-4">
            <CertificateViewer />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-fg-subtle">
            {certificate.caption}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
