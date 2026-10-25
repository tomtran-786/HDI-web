"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { annotate } from "rough-notation";

type NotationType = "underline" | "circle" | "strike-through";

// Vẽ khi phần tử vào 80% chiều cao viewport (rootMargin đáy -20%).
const DRAW_ROOT_MARGIN = "0px 0px -20% 0px";
const DRAW_DELAY_MS = 100;
// Thời lượng transition của `.reveal` trong globals.css (0.6s).
const REVEAL_TRANSITION_MS = 600;

/**
 * Nét vẽ phải chờ `Reveal` bao quanh trượt xong: `.reveal` có `transform` nên
 * là containing block của SVG rough-notation chèn cạnh phần tử, và khi
 * transform về `none` SVG nhảy sang tổ tiên khác, làm các hình chữ nhật đã đo
 * bị lệch.
 */
function revealSettleMs(el: HTMLElement, reduceMotion: boolean) {
  if (reduceMotion) return 0;
  const reveal = el.closest<HTMLElement>(".reveal");
  if (!reveal) return 0;
  const delay = parseFloat(getComputedStyle(reveal).transitionDelay) * 1000;
  return REVEAL_TRANSITION_MS + (Number.isFinite(delay) ? delay : 0) + 50;
}

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
        reduceMotion ? 0 : DRAW_DELAY_MS + revealSettleMs(el, reduceMotion),
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
