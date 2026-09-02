"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { restoreCartFromOrder } from "@/app/actions/checkout";
import { checkoutReclaim } from "@/content/checkout";
import { HANDOFF_COOKIE } from "@/lib/checkout-handoff-cookie";

/**
 * Hai trang PayOS trả về, và cả hai đều phải được bỏ qua.
 *
 * `/thanh-toan/ket-qua` là returnUrl — học viên tới đó nghĩa là vừa trả tiền
 * xong, và hủy đơn ngay lúc webhook còn đang trên đường là cách chắc chắn nhất
 * để phá một giao dịch thật. `/thanh-toan/huy` đã có đường hủy riêng, chặt chẽ
 * hơn: nó khớp `paymentLinkId` trước khi làm bất cứ điều gì.
 */
const SKIP = ["/thanh-toan/ket-qua", "/thanh-toan/huy"];

function hasHandoffCookie() {
  return document.cookie
    .split("; ")
    .some((part) => part.startsWith(`${HANDOFF_COOKIE}=`));
}

type Reclaimed = { code: number; orderId?: string };

/**
 * Thu hồi đơn khi học viên rời trang thanh toán bằng bất kỳ cách nào khác nút
 * "Hủy" của PayOS.
 *
 * Trước đây chỉ có đúng một đường đóng đơn: PayOS gọi về `cancelUrl` với
 * `paymentLinkId` khớp. Đóng tab, bấm Back, hay để app ngân hàng nuốt mất deep
 * link đều không sinh tín hiệu nào, và đơn cứ giữ ghế, giữ credits, giữ suất
 * giảm giá "đơn đầu tiên" của chính người mua cho tới lượt cron 03:00 hôm sau —
 * trên tài khoản Vercel Hobby thì đó là tối đa 24 giờ. Tệ hơn: trong quãng đó
 * `already_enrolled` chặn chính họ mua lại khóa vừa bỏ dở.
 *
 * Điều kiện chạy là DẤU BÀN GIAO, không phải "có đơn đang chờ": chỉ trình duyệt
 * thật sự vừa được đưa sang PayOS mới mang cookie này. Không có nó thì component
 * không gọi request nào, nên mọi khách khác trả giá bằng đúng một lần đọc
 * `document.cookie`.
 */
export function CheckoutReclaim() {
  const pathname = usePathname();
  const router = useRouter();
  const fired = useRef(false);
  const [reclaimed, setReclaimed] = useState<Reclaimed | null>(null);
  const [restoring, startRestore] = useTransition();

  useEffect(() => {
    // `fired` chứ không phải mảng phụ thuộc rỗng: StrictMode chạy effect hai
    // lần trong dev, và hai lượt POST cho cùng một dấu là hai lượt gọi PayOS.
    if (fired.current) return;
    if (SKIP.includes(pathname)) return;
    if (!hasHandoffCookie()) return;
    fired.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/thanh-toan/roi-trang", {
          method: "POST",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (typeof data !== "object" || data === null) return;
        const body = data as { huy?: unknown; code?: unknown; orderId?: unknown };
        if (body.huy !== true || typeof body.code !== "number") return;
        setReclaimed({
          code: body.code,
          orderId: typeof body.orderId === "string" ? body.orderId : undefined,
        });
        // Ghế vừa được trả và nhãn "Đang chờ thanh toán" trong giỏ vừa mất
        // hiệu lực; trang đang mở phải đọc lại con số mới.
        router.refresh();
      } catch {
        // Mạng chớp thì không có gì để nói với học viên: đơn vẫn nguyên vẹn, và
        // trang đơn hàng cùng cron hằng ngày vẫn là lưới phía sau.
      }
    })();
  }, [pathname, router]);

  if (!reclaimed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-card border border-line bg-card p-5 shadow-lg sm:inset-x-auto sm:right-6"
    >
      <p className="text-[15px] font-bold tracking-tight text-fg">
        {checkoutReclaim.title(reclaimed.code)}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        {checkoutReclaim.body}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {reclaimed.orderId && (
          <button
            type="button"
            disabled={restoring}
            onClick={() => {
              const orderId = reclaimed.orderId!;
              startRestore(async () => {
                const result = await restoreCartFromOrder(orderId);
                setReclaimed(null);
                // `/?cart=1` là đường mà các trang đăng nhập và hoàn tất hồ sơ
                // đã dùng để mở lại giỏ; CartProvider đọc cookie mới ở đúng lần
                // điều hướng này.
                if (result.ok) router.push("/?cart=1");
              });
            }}
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:opacity-60"
          >
            {restoring ? "Đang mở lại giỏ…" : checkoutReclaim.restore}
          </button>
        )}
        <button
          type="button"
          onClick={() => setReclaimed(null)}
          className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
        >
          {checkoutReclaim.dismiss}
        </button>
      </div>
    </div>
  );
}
