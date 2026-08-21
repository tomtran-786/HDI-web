"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMyOrder } from "../actions";
import { orderPage } from "@/content/checkout";

/**
 * Cancelling releases a seat, so it asks first — via the same native `<dialog>`
 * pattern as `components/course-card.tsx`: focus trap, Esc-to-close and focus
 * restore for free, instead of an in-place two-click toggle.
 */
export function CancelOrder({ orderId }: { orderId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = "cancel-order-title";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-sm font-semibold text-fg-subtle underline underline-offset-4 transition hover:text-primary"
      >
        {orderPage.cancel}
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
          <h3
            id={titleId}
            className="text-lg font-bold tracking-tight text-primary"
          >
            Hủy đơn này?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Chỗ học đang giữ sẽ được trả lại ngay. Bạn có thể đặt lại nếu kỳ
            học vẫn còn chỗ.
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
                  const result = await cancelMyOrder(orderId);
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
