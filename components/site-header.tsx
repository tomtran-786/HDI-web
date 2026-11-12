"use client";

import { useEffect, useState, type FocusEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, withoutHiddenCourses, type NavItem } from "@/content/navigation";
import { site } from "@/content/site";
import { ThemeToggle } from "./theme-toggle";
import { buttonClass } from "./ui/button";
import { Avatar } from "./ui/avatar";
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
  hiddenCourseSlugs = [],
  user,
}: {
  signedIn: boolean;
  isAdmin?: boolean;
  /** Khóa chưa mở bán: bỏ khỏi menu khóa học, cả desktop lẫn mobile. */
  hiddenCourseSlugs?: readonly string[];
  user?: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const [mobileOpenGroups, setMobileOpenGroups] = useState<string[]>([]);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  const visibleNav = withoutHiddenCourses(nav, hiddenCourseSlugs);
  const navItems: readonly NavItem[] = isAdmin
    ? [...visibleNav, ADMIN_NAV]
    : visibleNav;

  // Mục có nhãn giá (Kiểm tra đạo văn) lên đầu menu mobile; desktop giữ thứ tự gốc.
  const mobileNavItems = [
    ...navItems.filter((item) => item.badge),
    ...navItems.filter((item) => !item.badge),
  ];

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
    // "Hồ sơ học thuật" (/cong-bo) sống dưới mục "Về HDI" nhưng không nằm trên
    // path /ve-hdi/, nên nhánh chung không bắt được — phải nêu tên riêng.
    if (item.href === "/ve-hdi") {
      return pathname === "/ve-hdi" || pathname === "/cong-bo";
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const navLinkClass = (active: boolean, mobile = false) =>
    mobile
      ? `rounded-xs px-4 py-3 text-base font-semibold transition-colors ${
          active
            ? "bg-tint text-fg"
            : "text-fg-muted hover:bg-bg-soft hover:text-fg"
        }`
      : `px-2 py-2 text-sm font-semibold whitespace-nowrap transition-colors 2xl:px-3 ${
          active
            ? "text-fg shadow-[inset_0_-2px_0_var(--primary)]"
            : "text-fg-muted hover:text-fg"
        }`;

  const onDesktopBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setDesktopOpen(null);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-bg transition-colors ${
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
            className="h-9 w-9 rounded-sm"
          />
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-primary">{site.short}</span>
            {/* Admin có thêm mục "Quản trị": ở 1280–1535px thanh menu hết chỗ,
                nên chữ phụ của logo nhường chỗ (chỉ với admin, chỉ khoảng đó). */}
            <span
              className={`text-sm font-semibold text-fg-muted ${isAdmin ? "xl:hidden 2xl:inline" : ""}`}
            >
              Research Center
            </span>
          </span>
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-0.5 xl:flex 2xl:gap-1"
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
                  className={`${navLinkClass(active)} ${item.badge ? "inline-flex items-baseline gap-1.5" : ""}`}
                >
                  {item.label}
                  {item.badge && <NavBadge>{item.badge}</NavBadge>}
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
                  className={`flex items-center gap-1.5 px-2 py-2 text-sm font-semibold whitespace-nowrap transition-colors hover:text-fg 2xl:px-3 ${
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
                    className={`grid max-w-[calc(100vw-3rem)] gap-7 rounded-card border border-line bg-bg p-6 shadow-lg ${
                      item.groups.length === 1
                        ? "w-[19rem] grid-cols-1"
                        : item.href === "/dich-vu"
                          ? "w-[42rem] grid-cols-2"
                          : "w-[56rem] grid-cols-4"
                    }`}
                  >
                    {item.groups.map((group) => (
                      <div key={group.label}>
                        <p className="font-cond text-[0.8125rem] font-bold tracking-[0.08em] text-fg-subtle uppercase">
                          {group.label}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {group.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={() => setDesktopOpen(null)}
                                className="block rounded-xs px-2 py-2 text-sm font-semibold leading-snug text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {/* Nút "xem tất cả" chỉ có nghĩa với hub nhiều nhóm; menu
                        một nhóm (Về HDI) đã có link cha ngay trên tiêu đề. */}
                    {item.groups.length > 1 && (
                      <Link
                        href={item.href}
                        onClick={() => setDesktopOpen(null)}
                        className="col-span-full inline-flex items-center justify-center rounded-button border border-line px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-rule"
                      >
                        {item.href === "/dich-vu"
                          ? "Tất cả dịch vụ"
                          : "Tất cả khóa học"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {signedIn ? (
            <Link
              href="/tai-khoan"
              className="hidden items-center gap-2 rounded-button border border-line py-1 pl-1 pr-3 text-sm font-semibold text-fg transition-colors hover:border-rule sm:inline-flex"
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
                className="hidden px-3 py-2 text-sm font-semibold whitespace-nowrap text-fg-muted transition-colors hover:text-fg sm:inline-block"
              >
                Đăng nhập
              </Link>
              {/* Bọc ngoài để `hidden` không phải tranh với `inline-flex` của
                  buttonClass trên cùng một phần tử. */}
              <span className="hidden sm:inline-flex">
                <Link href="/dang-ky-tai-khoan" className={buttonClass({ size: "sm" })}>
                  Đăng ký
                </Link>
              </span>
            </>
          )}
          <CartButton />
          {/* Below 400px (`xs`) the cluster of cart + theme + menu buttons no
              longer fits the 320px viewport alongside the logo — the toggle
              is the least essential of the three, so it drops out here and
              reappears inside the mobile menu below. */}
          <div className="hidden xs:inline-flex">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen((value) => !value);
              setMobileOpenGroups([]);
            }}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-button border border-line text-fg-muted xl:hidden"
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
            className="fixed inset-x-0 bottom-0 top-16 z-10 bg-fg/20 xl:hidden"
          />
          <nav
            id="mobile-navigation"
            aria-label="Điều hướng di động"
            className="absolute inset-x-0 top-full z-20 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-bg shadow-lg xl:hidden"
          >
            <div className="shell py-5">
              {/* Mirrors the header's standalone toggle, which hides below
                  `xs` to keep the button row from overflowing 320px. */}
              <div className="flex items-center justify-between gap-2 rounded-card border border-line bg-bg-soft/60 px-4 py-3 xs:hidden">
                <span className="text-sm font-semibold text-fg-muted">
                  Giao diện sáng / tối
                </span>
                <ThemeToggle />
              </div>
              <p className="mt-4 px-1 font-cond text-[0.8125rem] font-bold tracking-[0.08em] text-fg-subtle uppercase xs:mt-0">
                Khám phá HDI
              </p>
              <div className="mt-3 grid gap-1">
                {mobileNavItems.map((item) => {
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
                        className={`${navLinkClass(active, true)} ${item.badge ? "flex items-baseline justify-between gap-3" : ""}`}
                      >
                        {item.label}
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
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
                          className="mt-1 block rounded-xs bg-bg-soft px-3 py-2.5 text-sm font-semibold text-primary"
                        >
                          Xem tất cả
                        </Link>
                        {item.groups.map((group) => (
                          <div key={group.label} className="mt-4">
                            <p className="px-3 font-cond text-[0.8125rem] font-bold tracking-[0.08em] text-fg-subtle uppercase">
                              {group.label}
                            </p>
                            <ul className="mt-1.5 space-y-0.5">
                              {group.children.map((child) => (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    onClick={closeMobile}
                                    className="block rounded-xs px-3 py-2.5 text-sm font-semibold leading-snug text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg"
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
                    className={buttonClass()}
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
                      className={buttonClass({ variant: "secondary" })}
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href="/dang-ky-tai-khoan"
                      onClick={closeMobile}
                      className={buttonClass()}
                    >
                      Đăng ký
                    </Link>
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

/** Nhãn giá cạnh mục menu: chữ gỉ sét, cùng màu nhấn với nhãn "phiên song song". */
function NavBadge({ children }: { children: string }) {
  return (
    <span className="font-cond text-xs font-bold whitespace-nowrap text-accent-text">
      {children}
    </span>
  );
}
