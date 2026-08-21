import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findCourse } from "@/lib/courses";
import { formatDate, formatVnd } from "@/lib/format";
import { orderPage, orderStatusLabel, orderStatusTone } from "@/content/checkout";
import { contact, links } from "@/content/site";
import { HoldCountdown } from "@/components/hold-countdown";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { IconArrow, IconMail, IconMessage } from "@/components/ui/icons";
import { CancelOrder } from "./cancel";
import { RetryPayment } from "./retry";

export const metadata: Metadata = {
  title: "Đơn hàng — HDI Research Center",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
}: PageProps<"/tai-khoan/don-hang/[code]">) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { code } = await params;
  const parsed = Number(code);
  // Order codes are sequential and therefore guessable — which is fine for a
  // number that goes in a bank memo, and exactly why the query below is scoped
  // to this user rather than looking the code up on its own.
  if (!Number.isInteger(parsed)) notFound();

  const order = await prisma.order.findFirst({
    where: { code: parsed, userId: session.user.id },
    select: {
      id: true,
      code: true,
      status: true,
      amountVnd: true,
      createdAt: true,
      expiresAt: true,
      paidAt: true,
      checkoutUrl: true,
      items: {
        select: {
          id: true,
          priceVnd: true,
          course: { select: { slug: true } },
        },
      },
    },
  });
  if (!order) notFound();

  const pending = order.status === "pending";

  return (
    <Section soft>
      <SectionHeading
        eyebrow={orderPage.eyebrow}
        title={`${orderPage.codeLabel} #${order.code}`}
        subtitle={`Đặt ngày ${formatDate(order.createdAt)}`}
      />
      <div className="mx-auto max-w-2xl">
        <div className="rounded-card border border-line bg-card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge tone={orderStatusTone[order.status] ?? "cool"}>
              {orderStatusLabel[order.status] ?? order.status}
            </Badge>
            {pending && (
              <HoldCountdown expiresAtIso={order.expiresAt.toISOString()} />
            )}
          </div>

          <ul className="mt-6">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-fg">
                    {findCourse(item.course.slug)?.title ?? item.course.slug}
                  </p>
                </div>
                {/* The snapshot on the line, not the course's current price —
                    what someone owes must not move after they agreed to it. */}
                <p className="font-bold tabular-nums text-fg">
                  {formatVnd(item.priceVnd)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {"Tổng cộng"}
            </p>
            <p className="text-2xl font-bold tracking-tight text-primary">
              {formatVnd(order.amountVnd)}
            </p>
          </div>
        </div>

        {pending ? (
          <div className="mt-5 rounded-card border border-primary bg-tint p-6 sm:p-7">
            <p className="text-lg font-bold tracking-tight text-primary">
              {orderPage.awaitingGateway.title}
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
              {orderPage.awaitingGateway.body}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {order.checkoutUrl && (
                <a
                  href={order.checkoutUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
                >
                  Thanh toán với PayOS
                  <IconArrow size={16} />
                </a>
              )}
              <a
                href={`mailto:${contact.email}?subject=${encodeURIComponent(`Thanh toán đơn #${order.code}`)}`}
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                <IconMail size={16} />
                Gửi email
              </a>
              {!order.checkoutUrl && (
                <a
                  href={links.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
                >
                  <IconMessage size={16} />
                  Nhắn Zalo
                </a>
              )}
            </div>
            {!order.checkoutUrl && (
              <div className="mt-4">
                <RetryPayment orderId={order.id} />
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
              {orderPage.awaitingGateway.hint}
            </p>
          </div>
        ) : order.status === "paid" ? (
          <div className="mt-5 rounded-card border border-line bg-card p-6 sm:p-7">
            <p className="text-lg font-bold tracking-tight text-success">
              {orderPage.paid.title}
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
              {orderPage.paid.body}
            </p>
            <Link
              href="/tai-khoan"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Vào trang tài khoản
              <IconArrow size={16} />
            </Link>
          </div>
        ) : (
          <p className="mt-5 rounded-card border border-line bg-card px-5 py-4 text-sm leading-relaxed text-fg-muted">
            {orderPage.closed[order.status as keyof typeof orderPage.closed] ??
              orderStatusLabel[order.status]}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/tai-khoan/don-hang"
            className="text-sm font-semibold text-fg-muted transition hover:text-primary"
          >
            ← Tất cả đơn hàng
          </Link>
          {pending && <CancelOrder orderId={order.id} />}
        </div>
      </div>
    </Section>
  );
}
