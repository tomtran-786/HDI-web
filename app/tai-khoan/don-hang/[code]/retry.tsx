"use client";

import { useState, useTransition } from "react";
import { retryMyPayment } from "../actions";
import { buttonClass } from "@/components/ui/button";

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
        className={buttonClass()}
      >
        {pending ? "Đang kết nối PayOS…" : "Thử tạo lại link PayOS"}
      </button>
      {error && <p className="mt-3 text-sm text-fg-muted">{error}</p>}
    </div>
  );
}

