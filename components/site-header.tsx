"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { nav, site } from "@/content/site";
import { ThemeToggle } from "./theme-toggle";
import { CtaLink } from "./ui/cta-link";
import { CartButton } from "./cart-button";
import { useCart } from "./cart-provider";
import { IconClose, IconMenu } from "./ui/icons";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Resolved on the client so the marketing page stays statically rendered.
  // While it loads we show the marketing CTA — the right default for the
  // overwhelmingly more common visitor, and no layout shift when it resolves.
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const { openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-bg/85 backdrop-blur transition-colors ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link href="/#top" className="flex items-baseline gap-2 font-bold tracking-tight">
          <span className="text-lg text-primary">{site.short}</span>
          <span className="text-sm text-fg-muted">Research Center</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link
              href="/tai-khoan"
              className="hidden rounded-full border border-primary px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition hover:bg-primary hover:text-primary-fg sm:inline-block"
            >
              Tài khoản
            </Link>
          ) : (
            <>
              {/* Until now /dang-nhap existed but nothing linked to it — a
                  returning student had no way in short of typing the URL. */}
              <Link
                href="/dang-nhap"
                className="hidden px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-fg-muted transition hover:text-primary sm:inline-block"
              >
                Đăng nhập
              </Link>
              <CtaLink
                source="header"
                target="tu-van"
                className="hidden rounded-full border border-primary px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition hover:bg-primary hover:text-primary-fg sm:inline-block"
              >
                Đăng ký tư vấn
              </CtaLink>
            </>
          )}
          <CartButton />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-muted lg:hidden"
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-bg lg:hidden">
          <div className="shell flex flex-col py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3 text-sm font-semibold text-fg-muted last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openCart();
              }}
              className="border-b border-line py-3 text-sm font-semibold text-fg-muted"
            >
              Giỏ hàng
            </button>
            {signedIn ? (
              <Link
                href="/tai-khoan"
                onClick={() => setOpen(false)}
                className="mt-3 mb-2 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-fg"
              >
                Tài khoản
              </Link>
            ) : (
              <>
                <Link
                  href="/dang-nhap"
                  onClick={() => setOpen(false)}
                  className="mt-3 rounded-full border border-line px-4 py-2.5 text-center text-sm font-bold text-fg"
                >
                  Đăng nhập
                </Link>
                <CtaLink
                  source="header-mobile"
                  target="tu-van"
                  className="mt-2 mb-2 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-fg"
                >
                  Đăng ký tư vấn
                </CtaLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
