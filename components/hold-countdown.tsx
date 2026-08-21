"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { orderPage } from "@/content/checkout";

/**
 * Live "còn HH:MM giữ chỗ" against a server-supplied deadline.
 *
 * No polling, no new API route: `expiresAtIso` is already selected by the
 * order-detail query, this just diffs it against a client clock. Renders the
 * static formatted deadline until the first tick so SSR markup has real
 * content and there is no hydration flash.
 */
export function HoldCountdown({ expiresAtIso }: { expiresAtIso: string }) {
  const deadline = new Date(expiresAtIso).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return (
      <span className="text-[13px] text-fg-subtle">
        {orderPage.holdUntil} {formatDateTime(new Date(expiresAtIso))}
      </span>
    );
  }

  const remainingMs = deadline - now;
  if (remainingMs <= 0) {
    return (
      <span className="text-[13px] font-semibold text-danger">
        Đã hết hạn giữ chỗ — đang chờ đối soát
      </span>
    );
  }

  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const urgent = remainingMs < 10 * 60 * 1000;
  const soon = remainingMs < 30 * 60 * 1000;

  return (
    <span
      className={`text-[13px] font-semibold ${
        urgent ? "text-danger" : soon ? "text-warning" : "text-fg-subtle font-normal"
      }`}
    >
      Còn {hours > 0 ? `${hours} giờ ` : ""}
      {minutes} phút giữ chỗ
    </span>
  );
}
