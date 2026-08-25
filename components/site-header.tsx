"use client";

import { useEffect, useState, type FocusEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, type NavItem } from "@/content/navigation";
import { site } from "@/content/site";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "./ui/avatar";
import { CtaLink } from "./ui/cta-link";
import { CartButton } from "./cart-button";
import {
  IconChevronDown,
  IconClose,
  IconMenu,
} from "./ui/icons";

/** Chỉ thêm vào header cho admin; footer luôn lấy `footerNav` công khai. */
const ADMIN_NAV: NavItem = { label: "Quản trị", href: "/quan-tri" };

export function SiteHeader({
  signedIn,
  isAdmin = false,
  user,
}: {
  signedIn: boolean;
  isAdmin?: boolean;
  user?: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const [mobileOpenGroups, setMobileOpenGroups] = useState<string[]>([]);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  const navItems: readonly NavItem[] = isAdmin ? [...nav, ADMIN_NAV] : nav;

  const closeMobile = () => {
    setOpen(false);
    setMobileOpenGroups([]);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDesktopOpen(null);
      closeMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const sectionItems = nav.filter((item) => item.href.startsWith("/#"));
    const syncHash = () => {
      const href = `/${window.location.hash}`;
      if (sectionItems.some((item) => item.href === href)) setActiveHref(href);
    };
    syncHash();

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

  const isActive = (item: NavItem) => {
    if (item.href.startsWith("/#")) {
      return pathname === "/" && activeHref === item.href;
    }
    if (item.href === "/dich-vu") {
      return (
        pathname === "/dich-vu" ||
        pathname.startsWith("/dich-vu/") ||
        pathname === "/kiem-tra-ai-dao-van" ||
        pathname.startsWith("/kiem-tra-ai-dao-van/")
      );
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

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

  const onDesktopBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setDesktopOpen(null);
  };

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
            closeMobile();
            setActiveHref(null);
          }}
          className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight"
        >
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
          {navItems.map((item) => {
            const active = isActive(item);
            if (!item.groups?.length) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setActiveHref(item.href);
                    setDesktopOpen(null);
                  }}
                  className={navLinkClass(active)}
                >
                  {item.label}
                </Link>
              );
            }

            const menuId = `desktop-${item.href.slice(1)}-menu`;
            const expanded = desktopOpen === item.href;
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setDesktopOpen(item.href)}
                onMouseLeave={() => setDesktopOpen(null)}
                onFocus={() => setDesktopOpen(item.href)}
                onBlur={onDesktopBlur}
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setDesktopOpen(null)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition hover:text-primary ${
                    active
                      ? "bg-card text-primary shadow-sm"
                      : "text-fg-muted"
                  }`}
                >
                  {item.label}
                  <IconChevronDown
                    aria-hidden
                    size={14}
                    className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </Link>

                <div
                  id={menuId}
                  className={`absolute left-1/2 top-full z-30 -translate-x-1/2 pt-3 transition ${
                    expanded
                      ? "visible translate-y-0 opacity-100"
                      : "pointer-events-none invisible -translate-y-1 opacity-0"
                  }`}
                >
                  <div
                    className={`grid max-w-[calc(100vw-3rem)] gap-7 rounded-card border border-line bg-bg p-6 shadow-[0_24px_56px_-20px_rgba(12,73,143,0.45)] ${
                      item.href === "/dich-vu"
                        ? "w-[42rem] grid-cols-2"
                        : "w-[56rem] grid-cols-4"
                    }`}
                  >
                    {item.groups.map((group) => (
                      <div key={group.label}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                          {group.label}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {group.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={() => setDesktopOpen(null)}
                                className="block rounded-lg px-2 py-2 text-sm font-semibold leading-snug text-fg-muted transition hover:bg-bg-soft hover:text-primary"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <Link
                      href={item.href}
                      onClick={() => setDesktopOpen(null)}
                      className="col-span-full inline-flex items-center justify-center rounded-full border border-line px-4 py-2.5 text-sm font-bold text-primary transition hover:border-primary"
                    >
                      {item.href === "/dich-vu"
                        ? "Tất cả dịch vụ"
                        : "Tất cả khóa học"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link
              href="/tai-khoan"
              className="hidden items-center gap-2 rounded-full border border-primary py-1 pl-1 pr-4 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition hover:bg-primary hover:text-primary-fg sm:inline-flex"
            >
              <Avatar
                src={user?.image}
                name={user?.name}
                email={user?.email}
                size="sm"
                className="border-transparent"
              />
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
            onClick={() => {
              setOpen((value) => !value);
              setMobileOpenGroups([]);
            }}
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
            onClick={closeMobile}
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
              <div className="mt-3 grid gap-1">
                {navItems.map((item) => {
                  const active = isActive(item);
                  if (!item.groups?.length) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          setActiveHref(item.href);
                          closeMobile();
                        }}
                        className={navLinkClass(active, true)}
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  const expanded = mobileOpenGroups.includes(item.href);
                  const menuId = `mobile-${item.href.slice(1)}-menu`;
                  return (
                    <div key={item.href} className="rounded-card border border-transparent">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={menuId}
                        onClick={() =>
                          setMobileOpenGroups((current) =>
                            current.includes(item.href)
                              ? current.filter((href) => href !== item.href)
                              : [...current, item.href],
                          )
                        }
                        className={`${navLinkClass(active, true)} flex w-full items-center justify-between text-left`}
                      >
                        {item.label}
                        <IconChevronDown
                          size={16}
                          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div id={menuId} hidden={!expanded} className="px-3 pb-3">
                        <Link
                          href={item.href}
                          onClick={closeMobile}
                          className="mt-1 block rounded-lg bg-bg-soft px-3 py-2.5 text-sm font-bold text-primary"
                        >
                          Xem tất cả
                        </Link>
                        {item.groups.map((group) => (
                          <div key={group.label} className="mt-4">
                            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                              {group.label}
                            </p>
                            <ul className="mt-1.5 space-y-0.5">
                              {group.children.map((child) => (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    onClick={closeMobile}
                                    className="block rounded-lg px-3 py-2.5 text-sm font-semibold leading-snug text-fg-muted transition hover:bg-bg-soft hover:text-primary"
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-2 border-t border-line pt-5 sm:grid-cols-2">
                {signedIn ? (
                  <Link
                    href="/tai-khoan"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-primary-fg"
                  >
                    <Avatar
                      src={user?.image}
                      name={user?.name}
                      email={user?.email}
                      size="sm"
                      className="border-transparent"
                    />
                    Mở trang tài khoản
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/dang-nhap"
                      onClick={closeMobile}
                      className="rounded-full border border-line px-5 py-3 text-center text-sm font-bold text-fg"
                    >
                      Đăng nhập
                    </Link>
                    <CtaLink
                      source="header-mobile"
                      target="tu-van"
                      onNavigate={closeMobile}
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
