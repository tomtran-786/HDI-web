"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMyOrder } from "../actions";
import { orderPage } from "@/content/checkout";

/**
 * Cancelling releases a seat, so it asks first.
 *
 * Two clicks rather than a modal: the confirmation replaces the button in
 * place, which needs no focus trap, no portal and no new component to get
 * wrong on a phone.
 */
export function CancelOrder({ orderId }: { orderId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-semibold text-fg-subtle underline underline-offset-4 transition hover:text-primary"
      >
        {orderPage.cancel}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {error && <span className="text-sm text-fg-muted">{error}</span>}
      <span className="text-sm text-fg-muted">Hủy đơn này?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await cancelMyOrder(orderId);
            if (result.ok) router.refresh();
            else setError(result.message);
          })
        }
        className="inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary disabled:opacity-60"
      >
        {pending ? "Đang hủy…" : "Hủy đơn"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm font-semibold text-fg-subtle transition hover:text-primary"
      >
        Giữ lại
      </button>
    </div>
  );
}
