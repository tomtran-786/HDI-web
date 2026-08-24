"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Section } from "@/components/ui/section";

/**
 * Ranh giới lỗi riêng cho khu quản trị.
 *
 * `updateCourseStatus` và `moderateReview` đều `throw` khi đầu vào sai hình
 * dạng — cố ý, vì đầu vào của chúng do chính trang này dựng ra nên một giá trị
 * lạ nghĩa là có người đang gọi tay vào endpoint. Trước đây không có error.tsx
 * nào dưới /quan-tri, nên cú throw đó rơi lên ranh giới toàn cục và quản trị
 * viên bị đá ra một trang lỗi chung, mất luôn ngữ cảnh đang làm dở.
 *
 * `error.message` KHÔNG được render: Next đã thay nó bằng chuỗi chung ở
 * production, và đọc nguyên văn lỗi server ra màn hình là thói quen xấu ngay cả
 * sau một cửa admin.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[quan-tri] Lỗi render chưa xử lý:", error);
  }, [error]);

  return (
    <Section soft>
      <div className="mx-auto max-w-2xl rounded-card border border-line bg-card p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Quản trị
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary">
          Thao tác không hoàn tất
        </h2>
        <p className="mt-3 text-base leading-relaxed text-fg-muted">
          Trang quản trị gặp lỗi khi xử lý yêu cầu vừa rồi. Dữ liệu chưa bị thay
          đổi. Thử lại, hoặc mở lại trang quản trị từ đầu.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-fg-subtle">
            Mã tra log: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
          >
            Thử lại
          </button>
          <Link
            href="/quan-tri"
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
          >
            Mở lại trang quản trị
          </Link>
        </div>
      </div>
    </Section>
  );
}
