import Image from "next/image";
import type { CourseCover as CourseCoverData } from "@/content/course";
import { ExternalLink } from "./ui/external-link";

/**
 * Ảnh bìa của khóa: ảnh Unsplash hoặc panel logo phần mềm. Một component cho
 * cả thẻ ở /khoa-hoc, thẻ "Khóa học khác" (`variant="card"`, khung 16:9 nằm
 * trong thẻ có `group` + `overflow-hidden`) và banner đầu trang chi tiết
 * (`variant="banner"`, tràn ngang, có dòng credit).
 */
export function CourseCover({
  cover,
  variant,
  sizes,
  eager = false,
}: {
  cover: CourseCoverData;
  variant: "card" | "banner";
  sizes: string;
  /** Banner nằm trong màn hình đầu: tải ngay, ưu tiên cao (Next 16 bỏ `priority`). */
  eager?: boolean;
}) {
  const banner = variant === "banner";

  return (
    <div
      className={`@container relative overflow-hidden border-b border-line ${
        banner ? "h-[200px] sm:h-[280px] lg:h-[340px]" : "aspect-[16/9]"
      }`}
    >
      {cover.kind === "photo" ? (
        <>
          <Image
            src={cover.src}
            // Trên thẻ, tên khóa đứng ngay dưới ảnh nên ảnh chỉ trang trí.
            alt={banner ? cover.alt : ""}
            fill
            loading={eager ? "eager" : undefined}
            fetchPriority={eager ? "high" : undefined}
            sizes={sizes}
            className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
          />
          {banner && (
            // Góc trái: góc phải dưới màn hình là chỗ của nút liên hệ nổi.
            <p className="absolute bottom-2 left-3 rounded-full bg-bg/75 px-2.5 py-1 text-[11px] text-fg-muted">
              Ảnh:{" "}
              <ExternalLink
                href={cover.credit.url}
                className="font-semibold text-fg decoration-fg-subtle/40 hover:text-primary"
              >
                {cover.credit.author}
              </ExternalLink>{" "}
              / Unsplash
            </p>
          )}
        </>
      ) : (
        // Cỡ logo theo bề rộng của chính khung (container query), không theo
        // màn hình: thẻ ở lưới 2 cột khổ md hẹp như thẻ trên điện thoại, còn
        // banner thì tràn ngang. Ở khung hẹp mọi logo phải nằm một hàng, vì
        // khung 16:9 hay banner 200px không đủ cao cho hai hàng.
        <div
          className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 bg-tint p-4 @md:gap-4 @md:p-6"
          style={{
            backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          {cover.logos.map((logo) =>
            logo.tile ? (
              <Image
                key={logo.src}
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                unoptimized
                loading={eager ? "eager" : undefined}
                className={`w-auto rounded-card ${SIZE.frame}`}
              />
            ) : (
              // Logo gốc thiết kế cho nền sáng nên thẻ luôn trắng, kể cả ở
              // dark mode.
              <span
                key={logo.src}
                className={`flex items-center rounded-card border border-line bg-white px-3 @md:px-4 @3xl:px-6 ${SIZE.frame}`}
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  unoptimized={logo.src.endsWith(".svg")}
                  sizes={banner ? "240px" : "180px"}
                  loading={eager ? "eager" : undefined}
                  className={`w-auto ${
                    // Cùng một chiều cao thì logo gần vuông (SmartPLS) trông bé
                    // hơn hẳn logo dài (Stata), nên được cho cao hơn.
                    logo.width / logo.height < 2.5 ? SIZE.compact : SIZE.wide
                  }`}
                />
              </span>
            ),
          )}
          {cover.extra && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-fg @md:text-sm">
              {cover.extra}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Chiều cao khung logo và logo bên trong, theo bề rộng khung chứa. */
const SIZE = {
  frame: "h-12 @md:h-20 @3xl:h-28",
  wide: "h-6 @md:h-9 @3xl:h-14",
  compact: "h-9 @md:h-14 @3xl:h-20",
};
