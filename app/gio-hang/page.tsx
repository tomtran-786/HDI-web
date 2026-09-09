import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { currentProfile } from "@/lib/current-profile";
import { currentSession } from "@/lib/current-session";
import { isProfileComplete } from "@/lib/profile";
import { safeNext } from "@/lib/safe-path";
import { cartPage } from "@/content/checkout";
import { PageBackdrop } from "@/components/page-backdrop";
import { Skeleton } from "@/components/ui/skeleton";
import { CartClient } from "./cart-client";

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
export default async function CartPage() {
  const session = await currentSession();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?tiep=${encodeURIComponent(safeNext("/gio-hang"))}`);
  }

  const user = await currentProfile(session.user.id);
  if (!user) redirect("/dang-nhap");
  if (!isProfileComplete(user)) {
    redirect(`/hoan-tat-ho-so?tiep=${encodeURIComponent(safeNext("/gio-hang"))}`);
  }

  return (
    <>
      <PageBackdrop>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {cartPage.eyebrow}
        </p>
        <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {cartPage.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base text-fg-muted sm:text-lg">
          {cartPage.intro}
        </p>
      </PageBackdrop>

      <section className="border-t border-line bg-bg">
        <div className="shell py-10 pb-28 sm:py-14 lg:pb-14">
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-2">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
