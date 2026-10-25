import Image from "next/image";
import type { CourseCover as CourseCoverData } from "@/content/course";
import { ExternalLink } from "./ui/external-link";

/**
 * Ảnh bìa của khóa: ảnh Unsplash hoặc panel logo phần mềm lót trên một ảnh
 * Unsplash phủ màu xanh. Một component cho cả thẻ ở /khoa-hoc, thẻ "Khóa học
 * khác" (`variant="card"`, khung 16:9 nằm
 * trong thẻ có `group` + `overflow-hidden`), banner tràn ngang
 * (`variant="banner"`) và khung media đầu trang chi tiết (`variant="hero"`,
 * 16:9 bo góc cạnh card học phí). Hai biến thể sau là ảnh chính của trang nên
 * có alt và dòng credit.
 *
 * `variant="thumb"` là ảnh nhỏ của một dòng hàng ở giỏ hàng / đơn hàng: lấp đầy
 * khung của cha (cha tự định kích thước và `overflow-hidden`), chỉ trang trí
 * nên không alt, không credit, và panel logo thu về một chip logo đầu tiên.
 */
export function CourseCover({
  cover,
  variant,
  sizes,
  eager = false,
}: {
  cover: CourseCoverData;
  variant: "card" | "banner" | "hero" | "thumb";
  sizes: string;
  /** Banner nằm trong màn hình đầu: tải ngay, ưu tiên cao (Next 16 bỏ `priority`). */
  eager?: boolean;
}) {
  if (variant === "thumb") return <CourseThumb cover={cover} sizes={sizes} />;
  const banner = variant !== "card";

  return (
    <div
      className={`@container relative overflow-hidden ${
        variant === "banner"
          ? "h-[200px] border-b border-line sm:h-[280px] lg:h-[340px]"
          : variant === "hero"
            ? "aspect-[16/9] rounded-card border border-line shadow-[0_18px_40px_-24px_rgba(12,73,143,0.45)]"
            : "aspect-[16/9] border-b border-line"
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
          {banner && <PhotoCredit credit={cover.credit} />}
        </>
      ) : (
        <>
          {/* Ảnh nền chỉ để lấp khung: logo mới là nội dung. */}
          <Image
            src={cover.background.src}
            alt=""
            fill
            loading={eager ? "eager" : undefined}
            fetchPriority={eager ? "high" : undefined}
            sizes={sizes}
            className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
          />
          {/* Lớp phủ cố định màu xanh đậm ở cả hai chế độ sáng/tối, vì logo
              luôn nằm trên thẻ trắng hoặc khối màu riêng. */}
          <div aria-hidden className="absolute inset-0 bg-[#0c2f57]/60" />
          {/* Cỡ logo theo bề rộng của chính khung (container query), không
              theo màn hình: thẻ ở lưới 2 cột khổ md hẹp như thẻ trên điện
              thoại, còn banner thì tràn ngang. Ở khung hẹp mọi logo phải nằm
              một hàng, vì khung 16:9 hay banner 200px không đủ cao cho hai
              hàng. */}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 p-4 @md:gap-4 @md:p-6">
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
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0c498f] @md:text-sm">
                {cover.extra}
              </span>
            )}
          </div>
          {banner && <PhotoCredit credit={cover.background.credit} />}
        </>
      )}
    </div>
  );
}

/** Credit ảnh Unsplash, chỉ hiện ở banner và hero. */
function PhotoCredit({ credit }: { credit: { author: string; url: string } }) {
  return (
    // Góc trái: góc phải dưới màn hình là chỗ của nút liên hệ nổi.
    <p className="absolute bottom-2 left-3 rounded-full bg-bg/75 px-2.5 py-1 text-[11px] text-fg-muted">
      Ảnh:{" "}
      <ExternalLink
        href={credit.url}
        className="font-semibold text-fg decoration-fg-subtle/40 hover:text-primary"
      >
        {credit.author}
      </ExternalLink>{" "}
      / Unsplash
    </p>
  );
}

/** Chiều cao khung logo và logo bên trong, theo bề rộng khung chứa. */
const SIZE = {
  frame: "h-12 @md:h-20 @3xl:h-28",
  wide: "h-6 @md:h-9 @3xl:h-14",
  compact: "h-9 @md:h-14 @3xl:h-20",
};

/** Ảnh nhỏ lấp đầy khung cha — xem `variant="thumb"`. */
function CourseThumb({
  cover,
  sizes,
}: {
  cover: CourseCoverData;
  sizes: string;
}) {
  const source = cover.kind === "photo" ? cover.src : cover.background.src;
  const first = cover.kind === "logos" ? cover.logos[0] : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image src={source} alt="" fill sizes={sizes} className="object-cover" />
      {first && (
        <>
          <div aria-hidden className="absolute inset-0 bg-[#0c2f57]/60" />
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <span className="flex max-w-full items-center rounded-md bg-white px-1.5 py-1">
              <Image
                src={first.src}
                alt=""
                width={first.width}
                height={first.height}
                unoptimized={first.src.endsWith(".svg")}
                className="h-6 w-auto max-w-full"
              />
            </span>
          </div>
        </>
      )}
    </div>
  );
}
