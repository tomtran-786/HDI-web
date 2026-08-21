"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { trackCartAdd } from "@/lib/analytics";
import { IconArrow, IconCart, IconCheck } from "./ui/icons";
import { enrolPage } from "@/content/checkout";

/**
 * The button that puts one intake in the cart.
 *
 * `blocked` is resolved on the server — whether the class is full, and whether
 * this student already holds a place in it — because both are facts about the
 * database that the browser has no way to know. The button only ever decides
 * "already in the cart", which is the one piece of state that genuinely lives
 * in the browser.
 */
export function AddToCart({
  cohortId,
  courseSlug,
  ky,
  blocked,
  signedIn,
  loginReturnTo,
}: {
  cohortId: string;
  courseSlug: string;
  ky: string;
  blocked: "no_seats" | "already_enrolled" | null;
  signedIn: boolean;
  loginReturnTo: string;
}) {
  const { has, add, full } = useCart();

  if (blocked === "already_enrolled") {
    return (
      <Link
        href="/tai-khoan"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-success transition hover:border-primary hover:text-primary"
      >
        <IconCheck size={16} />
        {enrolPage.enrolledLabel}
      </Link>
    );
  }

  if (blocked === "no_seats") {
    return (
      <span className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg-subtle">
        {enrolPage.fullLabel}
      </span>
    );
  }

  if (!signedIn) {
    return (
      <Link
        href={`/dang-nhap?tiep=${encodeURIComponent(loginReturnTo)}`}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
      >
        Đăng nhập để đăng ký
        <IconArrow size={15} />
      </Link>
    );
  }

  if (has(cohortId)) {
    return (
      <Link
        href="/gio-hang"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-fg"
      >
        {enrolPage.addedLabel}
        <IconArrow size={15} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={full}
      onClick={() => {
        add(cohortId);
        trackCartAdd(courseSlug, ky);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
    >
      <IconCart size={16} />
      {enrolPage.addLabel}
    </button>
  );
}
