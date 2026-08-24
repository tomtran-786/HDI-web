"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, site } from "@/content/site";
import { ThemeToggle } from "./theme-toggle";
import { CtaLink } from "./ui/cta-link";
import { CartButton } from "./cart-button";
import { IconClose, IconMenu } from "./ui/icons";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (pathname !== "/") return;

    const sectionItems = nav.filter((item) => item.href.startsWith("/#"));
    const syncHash = () => {
      const href = `/${window.location.hash}`;
      if (sectionItems.some((item) => item.href === href)) setActiveHref(href);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const current = visible[0];
        if (current) setActiveHref(`/#${current.target.id}`);
      },
      { rootMargin: "-18% 0px -72% 0px", threshold: 0 },
    );

    for (const item of sectionItems) {
      const section = document.getElementById(item.href.slice(2));
      if (section) observer.observe(section);
    }
    window.addEventListener("hashchange", syncHash);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  const isActive = (href: string) =>
    href.startsWith("/#")
      ? pathname === "/" && activeHref === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (active: boolean, mobile = false) =>
    mobile
      ? `rounded-card px-4 py-3 text-sm font-semibold transition ${
          active
            ? "bg-tint text-primary"
            : "text-fg-muted hover:bg-bg-soft hover:text-primary"
        }`
      : `rounded-full px-3 py-2 text-[13px] font-semibold transition ${
          active
            ? "bg-card text-primary shadow-sm"
            : "text-fg-muted hover:bg-card hover:text-primary"
        }`;

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-bg/85 backdrop-blur transition-colors ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/#top"
          onClick={() => {
            setOpen(false);
            setActiveHref(null);
          }}
          className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight"
        >
          {/* alt="" — the wordmark right next to it already names the centre,
              so labelling the mark too would read the name twice. */}
          <Image
            src="/images/logo-mark.png"
            alt=""
            width={256}
            height={256}
            className="h-9 w-9 rounded-lg"
          />
          <span className="flex items-baseline gap-2">
            <span className="text-lg text-primary">{site.short}</span>
            <span className="text-sm text-fg-muted">Research Center</span>
          </span>
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-0.5 rounded-full border border-line bg-bg-soft/80 p-1 xl:flex"
        >
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active
                    ? item.href.startsWith("/#")
                      ? "location"
                      : "page"
                    : undefined
                }
                onClick={() => setActiveHref(item.href)}
                className={navLinkClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
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
                Tư vấn miễn phí
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
            aria-controls="mobile-navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-muted xl:hidden"
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-10 bg-primary-deep/15 backdrop-blur-[1px] xl:hidden"
          />
          <nav
            id="mobile-navigation"
            aria-label="Điều hướng di động"
            className="absolute inset-x-0 top-full z-20 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-bg shadow-[0_24px_48px_-24px_rgba(12,73,143,0.4)] xl:hidden"
          >
            <div className="shell py-5">
              <p className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Khám phá HDI
              </p>
              <div className="mt-3 grid gap-1 sm:grid-cols-2">
                {nav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={
                        active
                          ? item.href.startsWith("/#")
                            ? "location"
                            : "page"
                          : undefined
                      }
                      onClick={() => {
                        setActiveHref(item.href);
                        setOpen(false);
                      }}
                      className={navLinkClass(active, true)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-2 border-t border-line pt-5 sm:grid-cols-2">
                {signedIn ? (
                  <Link
                    href="/tai-khoan"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-primary-fg"
                  >
                    Mở trang tài khoản
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/dang-nhap"
                      onClick={() => setOpen(false)}
                      className="rounded-full border border-line px-5 py-3 text-center text-sm font-bold text-fg"
                    >
                      Đăng nhập
                    </Link>
                    <CtaLink
                      source="header-mobile"
                      target="tu-van"
                      onNavigate={() => setOpen(false)}
                      className="rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-primary-fg"
                    >
                      Tư vấn miễn phí
                    </CtaLink>
                  </>
                )}
              </div>
              {!signedIn && (
                <p className="mt-3 text-center text-xs leading-relaxed text-fg-subtle sm:text-left">
                  Đăng nhập để xem khóa học, đơn hàng và quyền truy cập của bạn.
                </p>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
