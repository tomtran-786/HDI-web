"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/content/course";
import { trackCta } from "@/lib/analytics";
import {
  cardPresentation,
  type PublicAvailability,
} from "@/lib/course-availability";
import { useCart } from "./cart-provider";
import { CtaLink } from "./ui/cta-link";
import { IconArrow, IconMessage } from "./ui/icons";

/**
 * Thanh học phí cố định ở đáy trang chi tiết — bản HDI của thanh "Starting at
 * $297 · See Course Outline · Get Started" trên theanalystacademy.com.
 *
 * Chỉ hiện khi card học phí ở đầu trang (`watchId`) đã ra khỏi màn hình: lúc
 * card còn thấy được thì một nút đăng ký thứ hai chỉ là trùng lặp. Trước khi
 * effect chạy (render trên server, lần hydrate đầu) thanh không có mặt, nên HTML
 * tĩnh của trang vẫn chỉ có đúng một nút đăng ký.
 *
 * Khi thanh hiện, `data-course-bar` trên <html> đẩy nút liên hệ nổi lên trên
 * nó và chừa chỗ ở cuối trang (app/globals.css), để thanh không che footer.
 */
export function CourseStickyBar({
  course,
  availability,
  watchId,
  outlineHref,
}: {
  course: Course;
  availability?: PublicAvailability;
  watchId: string;
  outlineHref: string;
}) {
  const { openCart } = useCart();
  const { buyable } = cardPresentation(availability);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Chỉ hiện khi card đã cuộn lên phía trên, không phải khi nó còn ở dưới.
      setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  useEffect(() => {
    const root = document.documentElement;
    if (shown) root.dataset.courseBar = "";
    else delete root.dataset.courseBar;
    return () => {
      delete root.dataset.courseBar;
    };
  }, [shown]);

  if (!shown) return null;

  const { deal } = course.price;

  return (
    <div className="course-bar-in fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 shadow-[0_-12px_30px_-18px_rgba(12,73,143,0.35)] backdrop-blur">
      <div className="shell flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="hidden truncate text-sm font-bold text-fg sm:block">
            {course.title}
          </p>
          <p className="text-sm text-fg-muted">
            Học phí{" "}
            <span className="font-bold text-primary">
              {deal ? deal.amount : course.price.amount}
            </span>
            {deal && (
              <>
                {" "}
                <s className="text-fg-subtle line-through">
                  <span className="sr-only">Giá gốc </span>
                  {course.price.amount}
                </s>
                <span className="font-semibold text-success"> · {deal.condition}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={outlineHref}
            className="hidden items-center rounded-full border border-line px-4 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary md:inline-flex"
          >
            Xem lộ trình
          </a>
          {buyable ? (
            <button
              type="button"
              onClick={() => {
                trackCta("khoa-hoc-sticky", "dang-ky", course.slug);
                openCart(course.slug);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Đăng ký ngay
              <IconArrow size={15} />
            </button>
          ) : (
            <CtaLink
              source="khoa-hoc-sticky"
              target="zalo"
              course={course.slug}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              <IconMessage size={15} />
              Hỏi qua Zalo
            </CtaLink>
          )}
        </div>
      </div>
    </div>
  );
}
