"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { annotate } from "rough-notation";

type NotationType = "underline" | "circle" | "strike-through";

// Vẽ khi phần tử vào 80% chiều cao viewport (rootMargin đáy -20%).
const DRAW_ROOT_MARGIN = "0px 0px -20% 0px";
const DRAW_DELAY_MS = 100;
// Chờ `Reveal` bao quanh trượt lên xong rồi mới vẽ nét.
const REVEAL_SETTLE_MS = 350;

/**
 * Nét vẽ tay (rough-notation) trên một cụm chữ. Render ra `<span>` bọc chữ nên
 * văn bản SSR không đổi — SEO, screen reader và test vẫn đọc đủ. Màu nét lấy từ
 * `--accent` qua `.rough-annotation path` trong globals.css, nên đổi theme không
 * cần vẽ lại.
 */
export function Notation({
  type,
  children,
  className = "",
}: {
  type: NotationType;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const annotation = annotate(el, {
      type,
      strokeWidth: 2,
      iterations: 2,
      padding: type === "circle" ? [2, 8] : type === "underline" ? 1 : 0,
      animationDuration: 800,
      multiline: type === "underline",
      animate: !reduceMotion,
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      timer = setTimeout(
        () => annotation.show(),
        reduceMotion ? 0 : DRAW_DELAY_MS + REVEAL_SETTLE_MS,
      );
    };

    if (typeof IntersectionObserver === "undefined") {
      show();
    }
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              observer?.disconnect();
              show();
            },
            { rootMargin: DRAW_ROOT_MARGIN },
          );
    observer?.observe(el);

    return () => {
      observer?.disconnect();
      clearTimeout(timer);
      annotation.remove();
    };
  }, [type]);

  return (
    <span
      ref={ref}
      data-notation={type}
      className={`${type === "circle" ? "whitespace-nowrap " : ""}${className}`}
    >
      {children}
    </span>
  );
}
