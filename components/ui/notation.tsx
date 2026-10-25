"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { annotate } from "rough-notation";

type NotationType = "underline" | "circle" | "strike-through";
type RoughAnnotation = ReturnType<typeof annotate>;

// Vẽ khi phần tử vào 80% chiều cao viewport (rootMargin đáy -20%).
const DRAW_ROOT_MARGIN = "0px 0px -20% 0px";
const DRAW_DELAY_MS = 100;
// Thời lượng transition của `.reveal` trong globals.css (0.6s).
const REVEAL_TRANSITION_MS = 600;
// Gom các lần đổi kích thước liên tiếp (kéo cửa sổ, font swap) vào một lần vẽ lại.
const REDRAW_DEBOUNCE_MS = 120;

/**
 * Nét vẽ phải chờ `Reveal` bao quanh trượt xong: `.reveal` có `transform` nên
 * đang trượt thì mọi thứ bên trong còn dịch chuyển, và hình chữ nhật đo lúc đó
 * sẽ lệch khi transform về `none`.
 */
function revealSettleMs(el: HTMLElement, reduceMotion: boolean) {
  if (reduceMotion) return 0;
  const reveal = el.closest<HTMLElement>(".reveal");
  if (!reveal) return 0;
  const delay = parseFloat(getComputedStyle(reveal).transitionDelay) * 1000;
  return REVEAL_TRANSITION_MS + (Number.isFinite(delay) ? delay : 0) + 50;
}

/**
 * Nét gạch chân đặt ở đáy hộp nội dung của chữ, mà hộp đó cao hơn `line-height`
 * của tiêu đề (Source Sans có phần descender sâu), nên nét rơi xuống chạm dấu
 * của dòng kế. Kéo nét lên khoảng 0,2em, về gần đường descender.
 */
function underlinePadding(el: HTMLElement): number {
  const fontSize = parseFloat(getComputedStyle(el).fontSize);
  return Number.isFinite(fontSize) ? -Math.round(fontSize * 0.2) : 1;
}

/**
 * Nét vẽ tay (rough-notation) trên một cụm chữ. Render ra `<span>` bọc chữ nên
 * văn bản SSR không đổi — SEO, screen reader và test vẫn đọc đủ. Màu nét lấy từ
 * `--accent` qua `.rough-annotation path` trong globals.css, nên đổi theme không
 * cần vẽ lại.
 *
 * rough-notation chèn một `<svg position:absolute>` cạnh span. Nếu cha của span
 * không có vị trí thì containing block của svg là tổ tiên nào đó, và khi tổ tiên
 * đó đổi (vd. `.reveal` hết `transform`) nét nhảy đi nơi khác — từng lệch hàng
 * nghìn px. Vì vậy cha luôn được đặt `position: relative` trước khi vẽ.
 *
 * Nét được vẽ lại (không animate) khi cha đổi kích thước: ResizeObserver đặt
 * trên cha dạng block chứ không phải trên span inline, vốn không bao giờ báo.
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
  // Chữ đổi thì nét phải đo lại; children là phần tử React thì không so sánh được.
  const text = typeof children === "string" ? children : null;

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }

    let annotation: RoughAnnotation | undefined;
    let shown = false;
    let cancelled = false;
    let drawTimer: ReturnType<typeof setTimeout> | undefined;
    let redrawTimer: ReturnType<typeof setTimeout> | undefined;

    const draw = (animate: boolean) => {
      annotation?.remove();
      annotation = annotate(el, {
        type,
        strokeWidth: 2,
        iterations: 2,
        padding:
          type === "circle" ? [2, 8] : type === "underline" ? underlinePadding(el) : 0,
        animationDuration: 800,
        multiline: type === "underline",
        animate,
      });
      annotation.show();
    };

    const start = () => {
      drawTimer = setTimeout(
        async () => {
          // Font chưa tải xong thì chữ còn đổi bề rộng; đo sau khi font sẵn sàng.
          await document.fonts?.ready;
          if (cancelled) return;
          shown = true;
          draw(!reduceMotion);
        },
        reduceMotion ? 0 : DRAW_DELAY_MS + revealSettleMs(el, reduceMotion),
      );
    };

    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              intersection?.disconnect();
              start();
            },
            { rootMargin: DRAW_ROOT_MARGIN },
          );
    if (intersection) intersection.observe(el);
    else start();

    // Lần báo đầu tiên của ResizeObserver là kích thước ban đầu, không phải thay đổi.
    let initialSize = true;
    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (initialSize) {
              initialSize = false;
              return;
            }
            if (!shown) return;
            clearTimeout(redrawTimer);
            redrawTimer = setTimeout(() => {
              if (!cancelled) draw(false);
            }, REDRAW_DEBOUNCE_MS);
          });
    // ResizeObserver không báo cho phần tử inline, nên đi lên tới tổ tiên block
    // gần nhất (h1/h2) — chính nó mới đổi kích thước khi tiêu đề xuống dòng.
    let block: HTMLElement | null = parent;
    while (block && getComputedStyle(block).display === "inline") {
      block = block.parentElement;
    }
    resize?.observe(block ?? parent);

    return () => {
      cancelled = true;
      intersection?.disconnect();
      resize?.disconnect();
      clearTimeout(drawTimer);
      clearTimeout(redrawTimer);
      annotation?.remove();
    };
  }, [type, text]);

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
