/**
 * Funnel instrumentation (GĐ1 of the plan).
 *
 * Three events, chosen because they are the only intent signals the page
 * currently throws away:
 *
 *   `mo-lo-trinh`  opening a course modal — the strongest purchase intent on
 *                  the page, and until now completely invisible
 *   `bam-cta`      pressing any call to action — consultation, Zalo, or the
 *                  start of a sign-up. Two of the three leave the site, so
 *                  Vercel Analytics cannot attribute the exit on its own.
 *   `doi-sap-xep`  re-sorting the course grid — tells us whether price is what
 *                  people are actually shopping on
 *   `them-vao-gio`  adding a course to the cart — the first act that costs
 *                  something, and the last one before an account is required
 *   `bo-khoi-gio`  removing one again, which is where price objections show up
 *   `dat-don-hang`  pressing checkout. Compared against `them-vao-gio` this is
 *                  the abandonment rate, the number the whole funnel is for.
 *
 * The source label is an event property rather than a `?src=` query parameter:
 * `zalo.me` drops query strings, and the other two destinations are now internal
 * routes where a marketing param would just be noise.
 */

import { track } from "@vercel/analytics";

/**
 * Every source that emits a CTA event. Kept as a closed union so a typo in one
 * call site cannot silently split a funnel into two buckets.
 */
export type CtaSource =
  | "header"
  | "header-mobile"
  | "hero"
  | "chuong-trinh"
  | "khoa-hoc-modal"
  | "lien-he"
  | "bubble-lien-he"
  | "bubble-gop-y"
  | "footer";

/**
 * Where a CTA sends someone. The Google Form is deliberately absent: consultation
 * now lands on the page's own contact section (Zalo, email, phone) and buying now
 * starts with an account, so the form is no longer part of either path.
 */
export type CtaTarget =
  | "tu-van"
  | "zalo"
  | "dang-ky"
  | "email"
  | "phone"
  | "fanpage"
  | "gop-y";

/** Fired when a visitor presses any call to action. */
export function trackCta(
  source: CtaSource,
  target: CtaTarget,
  /** Slug of the course being viewed, for the two CTAs inside a course modal. */
  course?: string,
) {
  // `khoa` is omitted rather than sent empty: an "" value would show up in the
  // dashboard as its own bucket alongside the real slugs.
  track("bam-cta", {
    nguon: source,
    dich: target,
    ...(course ? { khoa: course } : {}),
  });
}

/** Fired when a course card is opened. */
export function trackCourseModal(course: string) {
  track("mo-lo-trinh", { khoa: course });
}

/** Fired when the sort control changes — not when the active pill is re-clicked. */
export function trackCourseSort(sort: string) {
  track("doi-sap-xep", { kieu: sort });
}

/** Fired when a course is added to the cart. */
export function trackCartAdd(course: string) {
  track("them-vao-gio", { khoa: course });
}

/** Fired when a course is taken back out of the cart. */
export function trackCartRemove(course: string) {
  track("bo-khoi-gio", { khoa: course });
}

/**
 * Fired when checkout is pressed — including by someone not signed in, who is
 * about to be sent to the sign-in page. That case is the one worth counting:
 * it is where a funnel loses people quietly.
 */
export function trackCheckout(items: number, amountVnd: number) {
  track("dat-don-hang", { so_khoa: items, tien: amountVnd });
}
