"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { links } from "@/content/site";
import { trackCta, type CtaSource, type CtaTarget } from "@/lib/analytics";

/**
 * The three destinations any CTA on the page points at.
 *
 * `tu-van` and `dang-ky` are internal routes. Consultation goes to the page's
 * own contact section — Zalo, email and phone are all there, which is where
 * people were being sent anyway.
 *
 * `dang-ky` resolves per course, to that course's intake list. Signing in is
 * not asked for here: the registration page asks for sign-in before adding,
 * which is the point at which an account actually becomes necessary. The
 * account-less fallback exists only so the union stays total — every current
 * caller of `dang-ky` sits inside a course modal and passes a slug.
 */
function hrefFor(target: CtaTarget, course?: string): string {
  if (target === "zalo") return links.zalo;
  if (target === "tu-van") return "/#lien-he";
  return course ? `/dang-ky/${course}` : "/dang-nhap";
}

/** Only Zalo leaves the site now; the other two must not open a new tab. */
const isExternal: Record<CtaTarget, boolean> = {
  "tu-van": false,
  "dang-ky": false,
  zalo: true,
};

/**
 * A call to action that reports which of the page's CTAs was pressed.
 *
 * The call site names *where it is* (`source`) and *what it offers*
 * (`target`) — never a URL — so a destination can change in one place without
 * the analytics labels drifting away from reality.
 */
export function CtaLink({
  source,
  target,
  course,
  className,
  children,
}: {
  source: CtaSource;
  target: CtaTarget;
  /** Course slug, for the CTAs that sit inside a course modal. */
  course?: string;
  className?: string;
  children: ReactNode;
}) {
  const onClick = () => trackCta(source, target, course);
  const href = hrefFor(target, course);

  if (isExternal[target]) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
