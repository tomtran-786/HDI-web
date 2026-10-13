import { Fragment } from "react";
import Image from "next/image";
import type { AdvisorPhoto, CaptionPart } from "@/content/about";
import { Reveal } from "./ui/reveal";

/**
 * Lưới ảnh hoạt động học thuật có caption. Ảnh tĩnh, không carousel hay
 * lightbox: khách đọc caption ngay dưới ảnh mà không phải thao tác thêm.
 * `columns={3}` dùng cho dải ba ảnh ở /hoi-thao-quoc-te.
 */
export function ActivityGallery({
  photos,
  columns = 2,
  className = "",
}: {
  photos: readonly AdvisorPhoto[];
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-x-6 gap-y-8 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""} ${className}`}
    >
      {photos.map((photo, index) => (
        <Reveal key={photo.id} delay={index * 60}>
          <PhotoFigure
            photo={photo}
            sizes={
              columns === 3
                ? "(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                : "(min-width: 1024px) 36rem, (min-width: 640px) 50vw, 100vw"
            }
            framed
          />
        </Reveal>
      ))}
    </div>
  );
}

/**
 * Một ảnh kèm caption. `framed` cắt về khung 4:3 cho lưới đều nhau; khi không
 * `framed` ảnh giữ nguyên tỉ lệ gốc.
 */
export function PhotoFigure({
  photo,
  sizes,
  framed = false,
  className = "",
}: {
  photo: AdvisorPhoto;
  sizes: string;
  framed?: boolean;
  className?: string;
}) {
  return (
    <figure className={className}>
      {framed ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-card">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={sizes}
            className="object-cover"
            style={photo.position ? { objectPosition: photo.position } : undefined}
          />
        </div>
      ) : (
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          className="h-auto w-full rounded-card border border-line"
        />
      )}
      <figcaption className="mt-3 text-sm leading-relaxed text-fg-muted">
        <PhotoCaption parts={photo.caption} />
      </figcaption>
    </figure>
  );
}

/** Caption có link ngoài: gạch chân để không phân biệt chỉ bằng màu. */
export function PhotoCaption({ parts }: { parts: readonly CaptionPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        typeof part === "string" ? (
          <Fragment key={index}>{part}</Fragment>
        ) : (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
          >
            {part.text}
            <span aria-hidden> ↗</span>
            <span className="sr-only"> (mở tab mới)</span>
          </a>
        ),
      )}
    </>
  );
}
