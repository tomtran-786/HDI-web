"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { observeReveal } from "@/lib/reveal-observer";

/**
 * Marks its children as "in view" once they scroll onto the screen, by
 * setting `data-shown`. It does not fade or lift anything itself. The only
 * remaining user is the manuscript deck in course-expect-band, whose rows key
 * their staggered entrance off `.reveal[data-shown]`; plain sections no longer
 * wrap their content in it.
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
