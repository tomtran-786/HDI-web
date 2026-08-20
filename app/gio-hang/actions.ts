"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isProfileComplete } from "@/lib/profile";
import { loadCart, readCartIds, writeCartIds } from "@/lib/cart";
import { createOrder } from "@/lib/orders";

export type CheckoutState = { error?: string };

const CART = "/gio-hang";

/**
 * Turn the cart into an order.
 *
 * A server action is a POST endpoint of its own, reachable by anyone who can
 * guess its id — so nothing here trusts the page that rendered the button. The
 * session is re-read, the profile is re-checked, and the basket is re-priced
 * from the database. The form carries no amounts at all; the only thing the
 * browser contributes is the cookie naming which intakes to look up.
 */
export async function checkout(): Promise<CheckoutState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?tiep=${encodeURIComponent(CART)}`);
  }

  // The dashboard collects phone and research stage before it lets anyone in;
  // an order made without them would leave HDI unable to contact the student
  // about the class they just paid for.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, stage: true },
  });
  if (!user) redirect("/dang-nhap");
  if (!isProfileComplete(user)) {
    redirect(`/hoan-tat-ho-so?tiep=${encodeURIComponent(CART)}`);
  }

  const ids = await readCartIds();
  const cart = await loadCart(ids, session.user.id);
  if (cart.buyable.length === 0) {
    return { error: "Không có kỳ học nào trong giỏ có thể đặt lúc này." };
  }

  const result = await createOrder(
    session.user.id,
    cart.buyable.map((line) => line.cohortId),
  );
  if (!result.ok) return { error: result.message };

  // Take only what was ordered out of the cart. Lines that were blocked (full,
  // or already enrolled) stay, so the student can see what did not go through
  // instead of watching the whole cart vanish.
  const ordered = new Set(cart.buyable.map((line) => line.cohortId));
  await writeCartIds(ids.filter((id) => !ordered.has(id)));

  redirect(`/tai-khoan/don-hang/${result.code}`);
}
