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
 *
 * Hỏi /api/trang-thai-don chứ KHÔNG gọi `router.refresh()` mỗi vòng. Refresh là
 * một lượt render RSC đầy đủ: chạy lại root layout kèm `auth()` rồi mới tới
 * truy vấn đơn. Tám vòng như vậy là mười sáu lượt render chạm database cho một
 * lượt thanh toán, đúng lúc `createOrder` đang giữ FOR UPDATE. Giờ mỗi vòng chỉ
 * đọc một dòng, và render lại đúng MỘT lần — khi trạng thái thật sự đổi.
 *
 * `banDau` là trạng thái trang đang hiển thị, tính bằng cùng tham số với
 * endpoint để hai bên so được với nhau.
 */
export function PaymentPoll({
  statusUrl,
  banDau,
}: {
  statusUrl: string;
  banDau: string;
}) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const [settled, setSettled] = useState(false);

  const exhausted = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    if (exhausted || settled) return;
    // `attempts` nằm trong danh sách phụ thuộc để mỗi vòng lên lịch vòng kế.
    // Bản trước phụ thuộc vào `[exhausted, router]`, mà cả hai đều không đổi
    // giữa các lần thử, nên effect chỉ chạy đúng một lần rồi thôi — component
    // mang tiếng thử tám lần nhưng thực tế chỉ thử một.
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(statusUrl, { cache: "no-store" });
        if (response.ok) {
          const data: unknown = await response.json();
          const trangThai =
            typeof data === "object" && data !== null && "trangThai" in data
              ? (data as { trangThai: unknown }).trangThai
              : undefined;
          if (typeof trangThai === "string" && trangThai !== banDau) {
            setSettled(true);
            router.refresh();
            return;
          }
        }
      } catch {
        // Mạng chớp hoặc 5xx: tính là một lần thử hỏng và đi tiếp. Không có gì
        // để báo cho học viên ở đây — trần MAX_ATTEMPTS mới là thứ kết thúc.
      }
      setAttempts((n) => n + 1);
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [attempts, exhausted, settled, statusUrl, banDau, router]);

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
          setSettled(false);
          router.refresh();
        }}
        className="mt-3 inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
      >
        {paymentResultPage.retryLabel}
      </button>
    </div>
  );
}
