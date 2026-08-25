"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { links } from "@/content/site";
import { trackCta, type CtaSource } from "@/lib/analytics";

type LinkTarget = "tu-van" | "zalo";

/**
 * The two link destinations used by marketing CTAs. Consultation goes to the page's
 * own contact section — Zalo, email and phone are all there, which is where
 * people were being sent anyway.
 *
 * Course registration is a button handled by the shared cart modal, not a link.
 */
function hrefFor(target: LinkTarget): string {
  if (target === "zalo") return links.zalo;
  return "/#lien-he";
}

/** Only Zalo leaves the site now; the other two must not open a new tab. */
const isExternal: Record<LinkTarget, boolean> = {
  "tu-van": false,
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
  onNavigate,
  children,
}: {
  source: CtaSource;
  target: LinkTarget;
  /** Course slug, for the CTAs that sit on a course detail page. */
  course?: string;
  className?: string;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  const onClick = () => {
    onNavigate?.();
    trackCta(source, target, course);
  };
  const href = hrefFor(target);

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
