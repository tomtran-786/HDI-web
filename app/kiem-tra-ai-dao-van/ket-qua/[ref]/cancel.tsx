"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { aiCheck } from "@/content/ai-check";
import { cancelMyServiceOrder } from "../../actions";

/**
 * Bản dịch vụ của `app/tai-khoan/don-hang/[code]/cancel.tsx`, cùng khuôn
 * `<dialog>` để có focus trap, Esc-to-close và khôi phục focus miễn phí.
 *
 * Khác một điểm trong lời hỏi: đơn dịch vụ không giữ chỗ của ai, nên câu hỏi
 * không hứa trả lại thứ gì — nó chỉ nói đúng việc sẽ xảy ra là đóng link PayOS.
 */
export function CancelServiceOrder({ orderId }: { orderId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = "cancel-service-order-title";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="mt-4 w-full text-center text-sm font-semibold text-fg-subtle underline underline-offset-4 transition hover:text-primary"
      >
        {aiCheck.result.cancel}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="w-[calc(100vw-2rem)] max-w-sm"
      >
        <div className="px-6 py-6 sm:px-7">
          <h3 id={titleId} className="text-lg font-bold tracking-tight text-primary">
            Hủy đơn dịch vụ này?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Link thanh toán trên PayOS sẽ được đóng lại. Bạn có thể tạo đơn mới
            với cùng số từ bất cứ lúc nào.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              Giữ lại
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await cancelMyServiceOrder(orderId);
                  if (result.ok) {
                    dialogRef.current?.close();
                    router.refresh();
                  } else {
                    setError(result.message);
                  }
                })
              }
              className="inline-flex items-center justify-center rounded-full bg-danger px-6 py-3 text-sm font-bold text-primary-fg transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Đang hủy…" : "Hủy đơn"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
