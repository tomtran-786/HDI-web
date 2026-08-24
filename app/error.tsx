"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Section } from "@/components/ui/section";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Lỗi render chưa xử lý:", error);
  }, [error]);

  return (
    <Section soft>
      <div className="mx-auto max-w-2xl rounded-card border border-line bg-card p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Có lỗi xảy ra
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary">
          Chưa tải được nội dung
        </h2>
        <p className="mt-3 text-base leading-relaxed text-fg-muted">
          Kết nối có thể đang gián đoạn. Bạn có thể thử tải lại phần này hoặc về
          trang chủ.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </Section>
  );
}
