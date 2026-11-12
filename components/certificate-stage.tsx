"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { observeReveal } from "@/lib/reveal-observer";

/**
 * Sân khấu cho chuyển động của khối chứng nhận (globals.css, `[data-cert]`).
 *
 * Mặc định mọi thứ hiện đủ — không có JS thì không có gì bị ẩn. Khi đã chạy,
 * component bật `data-ready` (tờ giấy và dấu tích chờ ở trạng thái đầu), rồi
 * bật `data-shown` lúc khối vào màn hình để tờ chứng nhận "in ra" và các dấu
 * tích được đánh lần lượt. Chạy một lần; giảm chuyển động thì CSS bỏ qua hết.
 */
export function CertificateStage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.ready = "true";
    return observeReveal(el, () => {
      el.dataset.shown = "true";
    });
  }, []);

  return (
    <div ref={ref} data-cert className={className}>
      {children}
    </div>
  );
}
