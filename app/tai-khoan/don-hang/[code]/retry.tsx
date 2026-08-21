"use client";

import { useState, useTransition } from "react";
import { retryMyPayment } from "../actions";

export function RetryPayment({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await retryMyPayment(orderId);
            if (result.ok) window.location.assign(result.checkoutUrl);
            else setError(result.message);
          })
        }
        className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:opacity-60"
      >
        {pending ? "Đang kết nối PayOS…" : "Thử tạo lại link PayOS"}
      </button>
      {error && <p className="mt-3 text-sm text-fg-muted">{error}</p>}
    </div>
  );
}

