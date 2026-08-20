"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { trackCartRemove, trackCheckout } from "@/lib/analytics";
import { IconArrow, IconTrash } from "@/components/ui/icons";
import { cartPage } from "@/content/checkout";
import { formatVnd } from "@/lib/format";
import { checkout, type CheckoutState } from "./actions";

/**
 * Drop one intake from the cart.
 *
 * `router.refresh()` is the point: the cookie is the source of truth and this
 * page is server-rendered from it, so without a refresh the row would keep
 * sitting there with a stale total underneath it.
 */
export function RemoveFromCart({
  cohortId,
  courseSlug,
  ky,
}: {
  cohortId: string;
  courseSlug: string;
  ky: string;
}) {
  const { remove } = useCart();
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={`${cartPage.removeLabel}: ${ky}`}
      onClick={() => {
        remove(cohortId);
        trackCartRemove(courseSlug, ky);
        router.refresh();
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-subtle transition hover:border-primary hover:text-primary"
    >
      <IconTrash size={16} />
    </button>
  );
}

/**
 * Quietly forget ids that no longer name an intake on sale.
 *
 * The server already ignores them when pricing, so this only stops the header
 * badge from counting things the cart no longer shows — a "3" above a list of
 * two is the kind of small wrongness that makes people distrust a total.
 */
export function PruneCart({ ids }: { ids: string[] }) {
  const { remove } = useCart();

  useEffect(() => {
    for (const id of ids) remove(id);
    // `ids` comes from the server render; re-running on a new array with the
    // same contents would be harmless but pointless.
  }, [ids, remove]);

  return null;
}

export function CheckoutButton({
  items,
  amountVnd,
  signedIn,
  disabled,
}: {
  items: number;
  amountVnd: number;
  signedIn: boolean;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    () => checkout(),
    {},
  );

  const classes =
    "inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

  // Signed out, the press is still worth counting — this is exactly where a
  // funnel loses people, and a plain link records nothing.
  if (!signedIn) {
    return (
      <Link
        href="/dang-nhap?tiep=%2Fgio-hang"
        onClick={() => trackCheckout(items, amountVnd, false)}
        className={classes}
      >
        {cartPage.checkoutSignedOut}
        <IconArrow size={16} />
      </Link>
    );
  }

  return (
    <form action={action} className="w-full sm:w-auto">
      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={disabled || pending}
        onClick={() => trackCheckout(items, amountVnd, true)}
        className={classes}
      >
        {pending
          ? "Đang tạo đơn…"
          : `${cartPage.checkout} · ${formatVnd(amountVnd)}`}
        {!pending && <IconArrow size={16} />}
      </button>
    </form>
  );
}
