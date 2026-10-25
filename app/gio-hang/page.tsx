import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { currentProfile } from "@/lib/current-profile";
import { currentSession } from "@/lib/current-session";
import { isProfileComplete } from "@/lib/profile";
import { safeNext } from "@/lib/safe-path";
import { cartReturnTo } from "@/lib/cart-return";
import { cartPage } from "@/content/checkout";
import { CheckoutHeader } from "@/components/checkout/checkout-header";
import { Skeleton } from "@/components/ui/skeleton";
import { CartClient } from "./cart-client";
import { CartItemCount } from "./cart-item-count";

export const metadata: Metadata = {
  title: "Giỏ hàng — HDI Research Center",
  robots: { index: false, follow: false },
};

/**
 * Giỏ hàng là một trang riêng, không còn là modal.
 *
 * `/gio-hang` nằm ngoài `/tai-khoan` nên không thừa được cổng ở layout kia —
 * nó tự chặn đúng ba bước như `app/actions/checkout.ts`: chưa đăng nhập,
 * chưa có hồ sơ, hồ sơ chưa đủ. `safeNext` cho `/gio-hang` đi qua nguyên vẹn
 * nên hai trang cổng biết đường quay lại.
 */
export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string | string[] }>;
}) {
  // Cùng đích quay về mà `CartClient` dựng cho đường 401/409 của nó
  // (`returnTo`). Không giữ slug ở đây thì người bấm "Đăng ký học khóa này" lúc
  // chưa đăng nhập quay lại một giỏ hàng không cuộn tới khóa họ vừa chọn — hai
  // cổng cho cùng một trang mà hai hành vi khác nhau.
  const raw = (await searchParams).course;
  const focusSlug = Array.isArray(raw) ? raw[0] : raw;
  const back = safeNext(cartReturnTo(focusSlug ?? null));

  const session = await currentSession();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?tiep=${encodeURIComponent(back)}`);
  }

  const user = await currentProfile(session.user.id);
  if (!user) redirect("/dang-nhap");
  if (!isProfileComplete(user)) {
    redirect(`/hoan-tat-ho-so?tiep=${encodeURIComponent(back)}`);
  }

  return (
    <>
      <CheckoutHeader
        trail={[{ label: cartPage.home, href: "/" }]}
        title={cartPage.title}
        aside={<CartItemCount />}
      />

      <section className="bg-bg">
        <div className="shell py-8 pb-28 sm:py-10 lg:pb-20">
          <Suspense fallback={<CartFallback />}>
            <CartClient />
          </Suspense>
        </div>
      </section>
    </>
  );
}

function CartFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        {[0, 1].map((row) => (
          <Skeleton key={row} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
