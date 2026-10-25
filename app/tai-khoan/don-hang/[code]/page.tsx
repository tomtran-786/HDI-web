import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentSession } from "@/lib/current-session";
import { prisma } from "@/lib/prisma";
import { syncPayosOrderStatus } from "@/lib/orders";
import { formatDate } from "@/lib/format";
import { cartPage, orderPage, orderStatusLabel } from "@/content/checkout";
import { composeEmailHref, links } from "@/content/site";
import { CheckoutHeader } from "@/components/checkout/checkout-header";
import {
  OrderLineList,
  OrderStatusBadges,
  orderSummaryLines,
} from "@/components/checkout/order-parts";
import { SummaryCard } from "@/components/checkout/summary-card";
import { HoldCountdown } from "@/components/hold-countdown";
import { PayosLink } from "@/components/payos-link";
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
  const session = await currentSession();
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
      referralDiscountVnd: true,
      creditAppliedVnd: true,
      createdAt: true,
      expiresAt: true,
      paidAt: true,
      checkoutUrl: true,
      groupSize: true,
      items: {
        select: {
          id: true,
          priceVnd: true,
          memberUserId: true,
          member: { select: { email: true } },
          course: { select: { code: true, slug: true } },
        },
      },
    },
  });
  if (!order) notFound();

  /**
   * Hỏi PayOS xem đơn này còn sống thật không, trước khi vẽ ra một trang nói
   * rằng nó đang chờ thanh toán.
   *
   * PayOS không gửi webhook cho việc hủy, nên một đơn đã bị hủy ở phía họ vẫn
   * đọc là `pending` ở đây — kèm nút "Thanh toán với PayOS" trỏ vào một link đã
   * chết, và một đồng hồ đếm ngược nói rằng chỗ vẫn đang được giữ. Trang đơn
   * hàng là nơi học viên tới để biết sự thật, nên nó phải trả giá cho việc đi
   * hỏi.
   *
   * Ghi trong lúc render an toàn với render lại, đúng lý do đã ghi ở
   * `app/thanh-toan/huy/page.tsx`: `cancelOrderLocally` lọc `status: "pending"`.
   * Cũng như ở đó, `revalidateTag` không gọi được lúc render page, nên bộ đếm
   * ghế công khai trễ tối đa 5 phút và trễ theo chiều an toàn.
   */
  const synced =
    order.status === "pending"
      ? await syncPayosOrderStatus(order.id, { userId: session.user.id })
      : { closed: false as const };
  const status = synced.closed ? synced.as : order.status;

  const pending = status === "pending";
  const { lines, total } = orderSummaryLines(order);

  // Nút chữ nhật bo nhẹ, đặc cho hành động chính và viền cho hành động phụ —
  // cùng ngôn ngữ với thẻ tóm tắt ở giỏ hàng.
  const secondaryButton =
    "inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary";

  return (
    <>
      <CheckoutHeader
        trail={[
          { label: cartPage.home, href: "/" },
          { label: "Tài khoản", href: "/tai-khoan" },
          { label: orderPage.eyebrow, href: "/tai-khoan/don-hang" },
        ]}
        title={`${orderPage.codeLabel} #${order.code}`}
        aside={`Đặt ngày ${formatDate(order.createdAt)}`}
      />

      <section className="bg-bg">
        <div className="shell py-8 pb-24 sm:py-10 lg:pb-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              {/* Dòng đơn lấy SNAPSHOT giá trên đơn, không phải giá hiện hành của
                  khóa: số tiền người ta đã đồng ý không được đổi theo bảng giá. */}
              <OrderLineList items={order.items} viewerId={session.user.id} />

              {pending ? (
                <div className="mt-6 rounded-md border border-primary bg-tint p-5">
                  <p className="font-bold text-primary">
                    {orderPage.awaitingGateway.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {orderPage.awaitingGateway.body}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
                    {orderPage.awaitingGateway.hint}
                  </p>
                </div>
              ) : status === "paid" ? (
                <div className="mt-6 rounded-md border border-line bg-card p-5">
                  <p className="font-bold text-success">{orderPage.paid.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {orderPage.paid.body}
                  </p>
                </div>
              ) : (
                <p className="mt-6 rounded-md border border-line bg-card px-5 py-4 text-sm leading-relaxed text-fg-muted">
                  {orderPage.closed[status as keyof typeof orderPage.closed] ??
                    orderStatusLabel[status]}
                </p>
              )}
            </div>

            <SummaryCard
              title={cartPage.summaryTitle}
              lines={lines}
              total={total}
              actions={
                pending ? (
                  <div className="space-y-3">
                    {order.checkoutUrl && (
                      <PayosLink
                        href={order.checkoutUrl}
                        handoff={{ kind: "order", key: String(order.code) }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
                      >
                        Thanh toán với PayOS
                        <IconArrow size={16} />
                      </PayosLink>
                    )}
                    {!order.checkoutUrl && <RetryPayment orderId={order.id} />}
                    <a
                      href={composeEmailHref(`Thanh toán đơn #${order.code}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={secondaryButton}
                    >
                      <IconMail size={16} />
                      Gửi email
                    </a>
                    {!order.checkoutUrl && (
                      <a
                        href={links.zalo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={secondaryButton}
                      >
                        <IconMessage size={16} />
                        Nhắn Zalo
                      </a>
                    )}
                    <div className="flex justify-center pt-1">
                      <CancelOrder orderId={order.id} />
                    </div>
                  </div>
                ) : status === "paid" ? (
                  <Link
                    href="/tai-khoan"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
                  >
                    Vào trang tài khoản
                    <IconArrow size={16} />
                  </Link>
                ) : undefined
              }
            >
              <div className="space-y-2">
                <OrderStatusBadges status={status} groupSize={order.groupSize} />
                {pending && (
                  <p>
                    <HoldCountdown expiresAtIso={order.expiresAt.toISOString()} />
                  </p>
                )}
              </div>
            </SummaryCard>
          </div>
        </div>
      </section>
    </>
  );
}
