import type { CSSProperties } from "react";
import { certificate } from "@/content/certificate";
import { CertificateStage } from "./certificate-stage";
import { CertificateViewer } from "./certificate-viewer";
import { CheckDot } from "./ui/check-dot";
import { IconAward } from "./ui/icons";
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
 * Khối chứng nhận: ảnh mẫu trong khung trắng, tiêu đề lớn ở cột chữ bên phải.
 *
 * Chuyển động (CertificateStage + `[data-cert]` trong globals.css): khi khối vào
 * màn hình, tờ chứng nhận trồi lên và lộ dần từ trên xuống như giấy ra khỏi máy
 * in, rồi bốn dấu tích được đánh lần lượt cạnh từng quyền lợi. Chữ luôn hiện
 * sẵn; chỉ hình và dấu tích chuyển động.
 *
 * Cột chữ đứng trước trong DOM để thứ tự đọc là tiêu đề → ảnh (và trên mobile
 * chữ lên trước ảnh); từ `lg` trở lên ảnh được kéo sang trái.
 */
export function CertificateSection() {
  return (
    <Section id={certificate.sectionId}>
      <CertificateStage className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div className="lg:order-2">
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
            {certificate.points.map((point, index) => (
              <li
                key={point}
                className="flex gap-3 text-base leading-relaxed text-fg-muted"
              >
                <CheckDot
                  className="cert-tick"
                  style={{ "--i": index } as CSSProperties}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:order-1">
          <div className="cert-paper rounded-card border border-line bg-white p-3 shadow-sm sm:p-4">
            <CertificateViewer />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-fg-subtle">
            {certificate.caption}
          </p>
        </div>
      </CertificateStage>
    </Section>
  );
}
