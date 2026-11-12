"use client";

import { useEffect } from "react";
import { Section } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";

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
    <Section>
      <div role="alert" className="max-w-2xl">
        <h2 className="text-[1.875rem] leading-[1.15] font-bold tracking-[-0.02em] sm:text-4xl">
          Chưa tải được nội dung
        </h2>
        <p className="mt-3 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
          Có lỗi xảy ra, có thể do kết nối đang gián đoạn. Hãy thử tải lại phần
          nội dung này.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className={buttonClass({ size: "lg" })}
          >
            Thử lại
          </button>
        </div>
      </div>
    </Section>
  );
}
