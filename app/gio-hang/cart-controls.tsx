"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
 * The row fades out on click instead of waiting for `router.refresh()` — the
 * cookie write is synchronous, but the server round-trip that re-renders the
 * list underneath it is not, and a removal that only shows up after that trip
 * reads as unresponsive.
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
  const [leaving, setLeaving] = useState(false);

  return (
    <button
      type="button"
      aria-label={`${cartPage.removeLabel}: ${ky}`}
      disabled={leaving}
      onClick={() => {
        setLeaving(true);
        remove(cohortId);
        trackCartRemove(courseSlug, ky);
        router.refresh();
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-subtle transition hover:border-primary hover:text-primary disabled:opacity-40"
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

type CheckoutLine = {
  cohortId: string;
  courseTitle: string;
  ky: string;
  priceVnd: number;
};

export function CheckoutButton({
  lines,
  amountVnd,
  signedIn,
  disabled,
}: {
  lines: CheckoutLine[];
  amountVnd: number;
  signedIn: boolean;
  disabled: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = "checkout-confirm-title";
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
        onClick={() => trackCheckout(lines.length, amountVnd, false)}
        className={classes}
      >
        {cartPage.checkoutSignedOut}
        <IconArrow size={16} />
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => dialogRef.current?.showModal()}
        className={classes}
      >
        {`${cartPage.checkout} · ${formatVnd(amountVnd)}`}
        <IconArrow size={16} />
      </button>

      {/* Order/PayOS link is created only after this is confirmed — nothing
          is written to the database by opening it. The itemised list here is
          the seam where a discount line slots in once pricing policy exists;
          today it is just the same numbers already visible on the page. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="w-[calc(100vw-2rem)] max-w-md"
      >
        <div className="px-6 py-6 sm:px-7">
          <h3
            id={titleId}
            className="text-lg font-bold tracking-tight text-primary"
          >
            {cartPage.confirmTitle}
          </h3>

          <ul className="mt-5 space-y-3">
            {lines.map((line) => (
              <li
                key={line.cohortId}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="text-fg-muted">
                  {line.courseTitle} · {line.ky}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-fg">
                  {formatVnd(line.priceVnd)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {cartPage.confirmTotal}
            </span>
            <span className="text-2xl font-bold tracking-tight text-primary">
              {formatVnd(amountVnd)}
            </span>
          </div>

          {state.error && (
            <p
              role="alert"
              className="mt-4 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted"
            >
              {state.error}
            </p>
          )}

          <form
            action={action}
            className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              {cartPage.confirmCancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              onClick={() => trackCheckout(lines.length, amountVnd, true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Đang tạo đơn…" : cartPage.confirmCta}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
