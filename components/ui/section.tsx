import type { ReactNode } from "react";
import { Notation } from "./notation";

type SectionTone = "plain" | "soft" | "band";

/**
 * One page section. `tone` picks the surface: `plain`, `soft` (a flat, barely
 * tinted paper) or `band` (a flat navy band). `soft` stays as a boolean alias
 * so the existing call sites don't change.
 *
 * Sections are separated by a hairline rule and whitespace, the way the parts
 * of a printed programme are — no washes, no decorative rings.
 */
export function Section({
  id,
  children,
  soft = false,
  tone,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  soft?: boolean;
  tone?: SectionTone;
  className?: string;
}) {
  const resolved: SectionTone = tone ?? (soft ? "soft" : "plain");

  if (resolved === "band") {
    return (
      <section id={id} className={`band relative scroll-mt-24 ${className}`}>
        <div className="shell relative py-12 sm:py-16 lg:py-20">{children}</div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-line ${
        resolved === "soft" ? "bg-bg-soft" : "bg-bg"
      } text-fg ${className}`}
    >
      <div className="shell py-12 sm:py-16 lg:py-20">{children}</div>
    </section>
  );
}

export interface HeadingMark {
  /** Cụm chữ được nhấn — phải là chuỗi con của `title`. */
  text: string;
  type?: "underline" | "circle";
}

/** Tách `title` tại `mark.text`; trả về null nếu không khớp (title vẫn render). */
export function splitTitleAtMark(title: string, mark: HeadingMark) {
  const index = title.indexOf(mark.text);
  if (!mark.text || index === -1) return null;
  return {
    before: title.slice(0, index),
    marked: mark.text,
    after: title.slice(index + mark.text.length),
  };
}

/**
 * Tiêu đề có một cụm được gạch/khoanh bằng nét vẽ tay. Nét vẽ tay chỉ còn
 * dùng tối đa một lần mỗi trang, cho đúng một tiêu đề chính — SectionHeading
 * không còn tự vẽ nó.
 */
export function MarkedTitle({ title, mark }: { title: string; mark?: HeadingMark }) {
  if (!mark) return <>{title}</>;
  const parts = splitTitleAtMark(title, mark);
  if (!parts) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`MarkedTitle: mark "${mark.text}" không nằm trong title "${title}"`);
    }
    return <>{title}</>;
  }
  return (
    <>
      {parts.before}
      <Notation type={mark.type ?? "underline"}>{parts.marked}</Notation>
      {parts.after}
    </>
  );
}

/**
 * Tiêu đề section, căn trái. Tiêu đề tự mang trọng lượng của nó: không còn
 * nhãn in hoa nhỏ phía trên (eyebrow) và không còn nét vẽ tay. Hai prop
 * `eyebrow` và `mark` vẫn được nhận để các trang chưa chuyển sang bố cục mới
 * không vỡ, nhưng không được vẽ ra; thông tin nào trong eyebrow thật sự cần
 * thì đưa vào `title` hoặc `subtitle` khi làm lại trang đó.
 */
export function SectionHeading({
  title,
  subtitle,
  align = "left",
  onBand = false,
  as: Heading = "h2",
}: {
  /** @deprecated Không còn được vẽ ra. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** @deprecated Không còn được vẽ ra. */
  mark?: HeadingMark;
  /** Tiêu đề nằm trên band navy: chữ trắng. */
  onBand?: boolean;
  /** `h1` khi đây là tiêu đề chính của trang (các màn đăng nhập, tài khoản). */
  as?: "h1" | "h2";
}) {
  return (
    <div className={`mb-8 sm:mb-10 ${align === "center" ? "text-center" : ""}`}>
      <Heading
        className={`text-[1.875rem] leading-[1.15] font-bold tracking-[-0.02em] sm:text-4xl lg:text-[2.625rem] ${
          onBand ? "text-white" : "text-fg"
        }`}
      >
        {title}
      </Heading>
      {subtitle && (
        <p
          className={`mt-3 max-w-[62ch] text-base sm:text-lg ${
            onBand ? "text-white/80" : "text-fg-muted"
          } ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
