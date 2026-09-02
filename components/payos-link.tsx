"use client";

import type { ReactNode } from "react";
import {
  HANDOFF_COOKIE,
  HANDOFF_MAX_AGE,
  serializeHandoff,
  type CheckoutHandoff,
} from "@/lib/checkout-handoff-cookie";

/**
 * Đặt dấu bàn giao từ trình duyệt, cho những đường sang PayOS KHÔNG đi qua một
 * Server Function.
 *
 * `app/actions/checkout.ts` và hai action còn lại đặt dấu ở phía server, nhưng
 * hai nút "Thanh toán với PayOS" và "Mở lại trang thanh toán" chỉ là thẻ `<a>`
 * trỏ thẳng vào `checkoutUrl` đã lưu. Không có request nào về HDI trên đường đi,
 * nên không có chỗ nào để `Set-Cookie` — và một đơn mở lại theo đường đó sẽ là
 * đơn duy nhất không ai thu hồi được.
 *
 * Ghi được từ JavaScript vì cookie này cố ý không `httpOnly`; xem
 * `lib/checkout-handoff-cookie.ts`.
 */
export function markHandoffInBrowser(handoff: CheckoutHandoff) {
  document.cookie =
    `${HANDOFF_COOKIE}=${serializeHandoff(handoff)}` +
    `; path=/; max-age=${HANDOFF_MAX_AGE}; samesite=lax`;
}

/**
 * Một liên kết sang trang thanh toán PayOS có để lại dấu bàn giao.
 *
 * Vẫn là một thẻ `<a>` thật, không phải `<button onClick>`: học viên phải mở
 * được nó ở tab mới, sao chép được địa chỉ, và thấy được nó là một liên kết.
 */
export function PayosLink({
  href,
  handoff,
  className,
  children,
}: {
  href: string;
  handoff: CheckoutHandoff;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => markHandoffInBrowser(handoff)}
    >
      {children}
    </a>
  );
}
