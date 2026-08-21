"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { paymentResultPage } from "@/content/checkout";

const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 4000;

/**
 * Re-checks the order a bounded number of times while PayOS's webhook is
 * still in flight, instead of leaving the student to guess whether reloading
 * will help. Capped rather than looping forever: once the cap is hit the
 * fallback is a manual retry plus the existing Zalo/email copy, not a script
 * that keeps polling an order that may never confirm.
 */
export function PaymentPoll() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  const exhausted = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    if (exhausted) return;
    const id = setTimeout(() => {
      setAttempts((n) => n + 1);
      router.refresh();
    }, INTERVAL_MS);
    return () => clearTimeout(id);
  }, [exhausted, router]);

  if (!exhausted) {
    return (
      <p className="mt-4 text-sm text-fg-subtle" role="status">
        {paymentResultPage.pollingHint}
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm leading-relaxed text-fg-muted">
        {paymentResultPage.pollingExhausted}
      </p>
      <button
        type="button"
        onClick={() => {
          setAttempts(0);
          router.refresh();
        }}
        className="mt-3 inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
      >
        {paymentResultPage.retryLabel}
      </button>
    </div>
  );
}
