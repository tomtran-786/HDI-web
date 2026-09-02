import { cookies } from "next/headers";
import {
  HANDOFF_COOKIE,
  HANDOFF_MAX_AGE,
  parseHandoff,
  serializeHandoff,
  type CheckoutHandoff,
} from "./checkout-handoff-cookie";

/**
 * Phía server của dấu bàn giao. Xem `checkout-handoff-cookie.ts` để biết vì sao
 * dấu này tồn tại và vì sao nó không `httpOnly`.
 *
 * `set` và `delete` chỉ gọi được trong Server Function hoặc Route Handler —
 * không gọi được lúc render page. Vì vậy mọi chỗ ĐẶT dấu đều là một action ngay
 * trước `redirect(checkoutUrl)`, còn chỗ XÓA dấu là endpoint thu hồi.
 */
export async function markCheckoutHandoff(handoff: CheckoutHandoff) {
  const jar = await cookies();
  jar.set(HANDOFF_COOKIE, serializeHandoff(handoff), {
    path: "/",
    maxAge: HANDOFF_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
}

export async function readCheckoutHandoff() {
  const jar = await cookies();
  return parseHandoff(jar.get(HANDOFF_COOKIE)?.value);
}

export async function clearCheckoutHandoff() {
  const jar = await cookies();
  jar.delete(HANDOFF_COOKIE);
}
