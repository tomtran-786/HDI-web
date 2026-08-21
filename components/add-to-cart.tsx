"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { trackCartAdd } from "@/lib/analytics";
import { IconArrow, IconCart, IconCheck } from "./ui/icons";
import { enrolPage } from "@/content/checkout";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition";

/**
 * One consistent state language across all five branches: filled primary is
 * a real action ("thêm vào giỏ" / sign in to continue), outline is something
 * already done (in cart / already enrolled), muted+disabled is a hard stop
 * (no seats). Five differently-styled buttons for closely related states
 * used to read as five different affordances.
 */
const variant = {
  primary: "bg-primary text-primary-fg hover:bg-primary-deep",
  outline: "border border-line text-fg hover:border-primary hover:text-primary",
  muted: "cursor-not-allowed border border-line text-fg-subtle",
} as const;

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
      <Link href="/tai-khoan" className={`${base} ${variant.outline}`}>
        <IconCheck size={16} className="text-success" />
        {enrolPage.enrolledLabel}
      </Link>
    );
  }

  if (blocked === "no_seats") {
    return (
      <span className={`${base} ${variant.muted}`}>{enrolPage.fullLabel}</span>
    );
  }

  if (!signedIn) {
    return (
      <Link
        href={`/dang-nhap?tiep=${encodeURIComponent(loginReturnTo)}`}
        className={`${base} ${variant.primary}`}
      >
        Đăng nhập để đăng ký
        <IconArrow size={15} />
      </Link>
    );
  }

  if (has(cohortId)) {
    return (
      <Link href="/gio-hang" className={`${base} ${variant.outline}`}>
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
      className={`${base} ${variant.primary} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <IconCart size={16} />
      {enrolPage.addLabel}
    </button>
  );
}
