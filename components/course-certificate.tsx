import { certificate } from "@/content/certificate";
import { CertificateViewer } from "./certificate-viewer";
import { CheckDot } from "./ui/check-dot";
import { IconAward } from "./ui/icons";
import { Reveal } from "./ui/reveal";
import { MarkedTitle, Section } from "./ui/section";

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
export function CertificateSection({ soft = false }: { soft?: boolean }) {
  return (
    <Section id={certificate.sectionId} soft={soft}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <Reveal className="lg:order-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent-text">
            {certificate.eyebrow}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-5xl lg:leading-[1.1]">
            <MarkedTitle
              title={certificate.title}
              mark={{ text: certificate.mark }}
            />
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
          <div className="relative px-2 pb-6 sm:px-4">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-4 -top-6 h-44 w-44 rounded-full bg-accent/35 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-4 -right-2 h-56 w-56 rounded-full bg-primary/25 blur-3xl"
            />
            <div className="relative -rotate-2 rounded-card border border-line bg-white p-3 shadow-[0_2px_100px_rgba(31,73,125,0.18)] transition-transform duration-300 hover:rotate-0 motion-reduce:rotate-0 motion-reduce:transition-none sm:p-4">
              <CertificateViewer />
            </div>
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg ring-4 ring-bg sm:left-1"
            >
              <IconAward size={26} />
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-fg-subtle">
            {certificate.caption}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
