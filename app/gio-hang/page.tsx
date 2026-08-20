import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadCart, readCartIds } from "@/lib/cart";
import { formatDate, formatVnd } from "@/lib/format";
import { cartPage } from "@/content/checkout";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { IconArrow, IconClock } from "@/components/ui/icons";
import { CheckoutButton, PruneCart, RemoveFromCart } from "./cart-controls";

export const metadata: Metadata = {
  title: "Giỏ hàng — HDI Research Center",
  robots: { index: false, follow: false },
};

const blockedNote: Record<string, string> = {
  no_seats: "Kỳ này đã hết chỗ",
  already_enrolled: "Bạn đã ghi danh kỳ này",
};

export default async function CartPage() {
  const session = await auth();
  const ids = await readCartIds();
  const cart = await loadCart(ids, session?.user?.id);

  return (
    <Section soft>
      <SectionHeading eyebrow={cartPage.eyebrow} title={cartPage.title} />

      {/* Ids the cookie still names but that no longer resolve. Rendered as a
          component so the removal happens in the browser, where the cookie is. */}
      {cart.droppedIds.length > 0 && <PruneCart ids={cart.droppedIds} />}

      {cart.lines.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-8 text-center sm:p-10">
          <p className="text-lg font-bold tracking-tight">{cartPage.empty}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
            {cartPage.emptyBody}
          </p>
          <Link
            href="/#khoa-hoc"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
          >
            {cartPage.browse}
            <IconArrow size={16} />
          </Link>
        </div>
      ) : (
        <>
          {cart.droppedIds.length > 0 && (
            <p className="mb-5 rounded-card border border-line bg-card px-5 py-4 text-sm leading-relaxed text-fg-muted">
              {cartPage.droppedNotice}
            </p>
          )}

          <ul className="space-y-4">
            {cart.lines.map((line) => (
              <li
                key={line.cohortId}
                className={`flex flex-col gap-4 rounded-card border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${
                  line.blocked ? "border-line opacity-70" : "border-line"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{line.ky}</Badge>
                    {line.blocked && (
                      <span className="text-[11px] font-semibold text-fg-subtle">
                        {blockedNote[line.blocked]}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-bold leading-snug tracking-tight">
                    {line.courseTitle}
                  </p>
                  <p className="mt-1 text-[13px] text-fg-muted">
                    Khai giảng {formatDate(line.khaiGiang)} · {line.lichHoc}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <p className="text-lg font-bold tracking-tight text-primary">
                    {formatVnd(line.priceVnd)}
                  </p>
                  <RemoveFromCart
                    cohortId={line.cohortId}
                    courseSlug={line.courseSlug}
                    ky={line.ky}
                  />
                </div>
              </li>
            ))}
          </ul>

          {cart.buyable.length < cart.lines.length && (
            <p className="mt-4 text-sm leading-relaxed text-fg-subtle">
              {cartPage.blockedNotice}
            </p>
          )}

          <div className="mt-8 rounded-card border border-line bg-card p-6 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                {cartPage.total} · {cart.buyable.length} kỳ
              </p>
              <p className="text-3xl font-bold tracking-tight text-primary">
                {formatVnd(cart.totalVnd)}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm leading-relaxed text-fg-muted">
                <IconClock size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
                {cartPage.holdNote}
              </p>
              <CheckoutButton
                items={cart.buyable.length}
                amountVnd={cart.totalVnd}
                signedIn={Boolean(session?.user?.id)}
                disabled={cart.buyable.length === 0}
              />
            </div>
          </div>
        </>
      )}
    </Section>
  );
}
