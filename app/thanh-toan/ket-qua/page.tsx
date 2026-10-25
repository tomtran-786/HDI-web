import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentSession } from "@/lib/current-session";
import { syncPayosOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { cartPage, paymentResultPage } from "@/content/checkout";
import { CheckoutHeader } from "@/components/checkout/checkout-header";
import {
  OrderLineList,
  orderSummaryLines,
} from "@/components/checkout/order-parts";
import { SummaryCard } from "@/components/checkout/summary-card";
import { Badge } from "@/components/ui/badge";
import { PaymentPoll } from "@/components/payment-poll";

export const metadata: Metadata = {
  title: "Kết quả thanh toán — HDI Research Center",
  robots: { index: false, follow: false },
};

export default async function PaymentResultPage({
  searchParams,
}: PageProps<"/thanh-toan/ket-qua">) {
  const values = await searchParams;
  const code = Number(values.orderCode);
  const returnTo = Number.isInteger(code)
    ? `/thanh-toan/ket-qua?orderCode=${code}`
    : "/tai-khoan/don-hang";
  const session = await currentSession();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?tiep=${encodeURIComponent(returnTo)}`);
  }
  if (!Number.isInteger(code)) notFound();

  const order = await prisma.order.findFirst({
    where: { code, userId: session.user.id },
    select: {
      id: true,
      code: true,
      status: true,
      amountVnd: true,
      referralDiscountVnd: true,
      creditAppliedVnd: true,
      items: {
        select: {
          priceVnd: true,
          course: { select: { code: true, slug: true } },
        },
      },
    },
  });
  if (!order) notFound();

  // Chỉ ĐỌC trạng thái link, không hủy gì ở PayOS. Trang này là returnUrl nên
  // phần lớn lượt vào đây là người vừa trả tiền xong — `syncPayosOrderStatus`
  // để nguyên mọi trạng thái có tiền và chỉ đóng đơn khi chính PayOS đã coi link
  // là chết. Không có bước này, một link bị hủy hoặc hết hạn sẽ hiện "đang chờ
  // xác nhận" rồi poll tám vòng vào hư không.
  const synced =
    order.status === "pending"
      ? await syncPayosOrderStatus(order.id, { userId: session.user.id })
      : { closed: false as const };
  const status = synced.closed ? synced.as : order.status;

  const paid = status === "paid";
  // Ba trạng thái, không phải hai. Trước đây mọi thứ không phải `paid` đều đọc
  // là "đang chờ PayOS xác nhận", nên một đơn đã hủy vẫn được vẽ như một đơn
  // sắp có tiền về — và cái nút poll bên dưới hứa một điều không bao giờ tới.
  const waiting = status === "pending";

  const message = paid
    ? paymentResultPage.paid
    : waiting
      ? paymentResultPage.waiting
      : {
          title: paymentResultPage.closed.title,
          subtitle:
            paymentResultPage.closed[
              status as keyof typeof paymentResultPage.closed
            ] ?? paymentResultPage.closed.title,
        };
  const { lines, total } = orderSummaryLines(order);

  return (
    <>
      <CheckoutHeader
        trail={[
          { label: cartPage.home, href: "/" },
          { label: cartPage.title, href: "/gio-hang" },
        ]}
        title={paymentResultPage.header.title}
        aside={paymentResultPage.header.order(order.code)}
      />

      <section className="bg-bg">
        <div className="shell py-8 pb-24 sm:py-10 lg:pb-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              <div role="status" className="mb-5 rounded-md border border-line bg-bg-soft px-4 py-4">
                <p className="font-bold text-fg">{message.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                  {message.subtitle}
                </p>
              </div>
              <OrderLineList items={order.items} />
            </div>

            <SummaryCard
              title={cartPage.summaryTitle}
              lines={lines}
              total={total}
              actions={
                <div className="space-y-3">
                  <Link
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition-colors hover:bg-primary-deep"
                    href={paid ? "/tai-khoan" : `/tai-khoan/don-hang/${order.code}`}
                  >
                    {paid
                      ? paymentResultPage.paid.cta
                      : paymentResultPage.viewOrder(order.code)}
                  </Link>
                  {waiting && (
                    <PaymentPoll
                      statusUrl={`/api/trang-thai-don?donHang=${order.code}`}
                      banDau={status}
                    />
                  )}
                </div>
              }
            >
              <Badge tone={paid ? "success" : waiting ? "warning" : "danger"}>
                {paid
                  ? paymentResultPage.badge.paid
                  : waiting
                    ? paymentResultPage.badge.waiting
                    : paymentResultPage.badge.closed}
              </Badge>
            </SummaryCard>
          </div>
        </div>
      </section>
    </>
  );
}
