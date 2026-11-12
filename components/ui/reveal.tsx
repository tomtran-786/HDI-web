"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { observeReveal } from "@/lib/reveal-observer";

/**
 * Marks its children as "in view" once they scroll onto the screen, by
 * setting `data-shown`. It no longer fades or lifts anything itself — content
 * is visible from the first paint. A child that has a deliberate entrance
 * (the manuscript deck rows) keys its own CSS off `.reveal[data-shown]`.
 *
 * `delay` is kept for call sites that still pass it; it only postpones the
 * attribute.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = observeReveal(el, () => {
      timer = setTimeout(() => {
        el.dataset.shown = "true";
      }, delay);
    });
    return () => {
      if (timer) clearTimeout(timer);
      stop?.();
    };
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
