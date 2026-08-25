"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/content/navigation";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const HOME: BreadcrumbItem = { label: "Trang chủ", href: "/" };

const staticLabels: Record<string, string> = {
  "/ve-hdi": "Về HDI",
  "/cong-bo": "Hồ sơ học thuật",
  "/dang-nhap": "Đăng nhập",
  "/dang-ky-tai-khoan": "Đăng ký tài khoản",
  "/quen-mat-khau": "Quên mật khẩu",
  "/dat-lai-mat-khau": "Đặt lại mật khẩu",
  "/xac-thuc-email": "Xác thực email",
  "/hoan-tat-ho-so": "Hoàn tất hồ sơ",
  "/quan-tri": "Quản trị",
};

const serviceNav = nav.find((item) => item.href === "/dich-vu");
const courseNav = nav.find((item) => item.href === "/khoa-hoc");

function childLabel(parent: typeof serviceNav, pathname: string) {
  return parent?.groups
    ?.flatMap((group) => group.children)
    .find((child) => child.href === pathname)?.label;
}

/**
 * Không đưa slug, mã đơn hoặc mã kết quả vào UI. Dynamic route chỉ dùng nhãn
 * đã biên tập trong catalog; route cá nhân dùng tên trang trung tính.
 */
export function breadcrumbsForPathname(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") return [];

  const staticLabel = staticLabels[pathname];
  if (staticLabel) return [HOME, { label: staticLabel }];

  if (pathname === "/dich-vu") {
    return [HOME, { label: "Dịch vụ" }];
  }
  if (pathname.startsWith("/dich-vu/")) {
    return [
      HOME,
      { label: "Dịch vụ", href: "/dich-vu" },
      { label: childLabel(serviceNav, pathname) ?? "Không tìm thấy dịch vụ" },
    ];
  }

  if (pathname === "/kiem-tra-ai-dao-van") {
    return [
      HOME,
      { label: "Dịch vụ", href: "/dich-vu" },
      { label: "Kiểm tra AI & Đạo văn" },
    ];
  }
  if (pathname.startsWith("/kiem-tra-ai-dao-van/ket-qua/")) {
    return [
      HOME,
      { label: "Dịch vụ", href: "/dich-vu" },
      { label: "Kiểm tra AI & Đạo văn", href: "/kiem-tra-ai-dao-van" },
      { label: "Kết quả dịch vụ" },
    ];
  }

  if (pathname === "/khoa-hoc") {
    return [HOME, { label: "Khóa học" }];
  }
  if (pathname.startsWith("/khoa-hoc/")) {
    return [
      HOME,
      { label: "Khóa học", href: "/khoa-hoc" },
      { label: childLabel(courseNav, pathname) ?? "Không tìm thấy khóa học" },
    ];
  }

  if (pathname === "/tai-khoan") {
    return [HOME, { label: "Tài khoản" }];
  }
  if (pathname === "/tai-khoan/don-hang") {
    return [
      HOME,
      { label: "Tài khoản", href: "/tai-khoan" },
      { label: "Đơn hàng" },
    ];
  }
  if (pathname.startsWith("/tai-khoan/don-hang/")) {
    return [
      HOME,
      { label: "Tài khoản", href: "/tai-khoan" },
      { label: "Đơn hàng", href: "/tai-khoan/don-hang" },
      { label: "Chi tiết đơn hàng" },
    ];
  }

  if (pathname === "/thanh-toan/ket-qua") {
    return [
      HOME,
      { label: "Tài khoản", href: "/tai-khoan" },
      { label: "Kết quả thanh toán" },
    ];
  }
  if (pathname === "/thanh-toan/huy") {
    return [
      HOME,
      { label: "Tài khoản", href: "/tai-khoan" },
      { label: "Thanh toán đã hủy" },
    ];
  }

  return [HOME, { label: "Không tìm thấy trang" }];
}

export function SiteBreadcrumbs() {
  const pathname = usePathname();
  const items = breadcrumbsForPathname(pathname);
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-line bg-bg-soft/95 text-fg"
    >
      <div className="shell py-3.5 sm:py-4">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.12em] sm:text-xs">
          {items.map((item, index) => {
            const current = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
                {index > 0 && (
                  <span aria-hidden className="text-fg-subtle/60">
                    ›
                  </span>
                )}
                {item.href && !current ? (
                  <Link
                    href={item.href}
                    className="text-primary transition hover:text-primary-deep hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={current ? "page" : undefined} className="text-fg-subtle">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
