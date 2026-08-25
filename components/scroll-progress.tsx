"use client";

import { useEffect, useRef } from "react";

/** Chuẩn hóa vị trí cuộn thành khoảng 0–1; clamp cả overscroll của Safari. */
export function getScrollProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const scrollableHeight = scrollHeight - viewportHeight;
  if (scrollableHeight <= 0) return 0;
  return Math.min(Math.max(scrollY / scrollableHeight, 0), 1);
}

/** Thanh mảnh sát mép trên cho biết người đọc đã đi được bao xa trong trang.
 *
 * Ghi transform thẳng vào phần tử thay vì setState ở mỗi sự kiện scroll để
 * toàn bộ app shell không phải render lại hàng chục lần mỗi giây. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = getScrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      element.style.transform = `scaleX(${progress})`;
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-scroll-progress
      aria-hidden="true"
      className="scroll-progress"
    />
  );
}
