import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentSession } from "@/lib/current-session";
import { aiCheck, serviceKindLabel } from "@/content/ai-check";
import { orderStatusLabel, orderStatusTone } from "@/content/checkout";
import { links } from "@/content/site";
import { formatVnd } from "@/lib/format";
import {
  cancelServiceOrder,
  findServiceOrder,
  serviceOrderView,
  syncPayosServiceOrderStatus,
} from "@/lib/service-orders";
import { allowUserAction } from "@/lib/auth-throttle";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeading } from "@/components/ui/section";
import { IconArrow, IconMessage } from "@/components/ui/icons";
import { PaymentPoll } from "@/components/payment-poll";
import { PayosLink } from "@/components/payos-link";
import { CancelServiceOrder } from "./cancel";
import { CopyCode } from "./copy-code";

export const metadata: Metadata = {
  title: "Đơn dịch vụ — HDI Research Center",
  // Trang của một đơn cụ thể, không phải nội dung để tìm thấy trên Google.
  robots: { index: false, follow: false },
};

export default async function ServiceOrderResultPage({
  params,
  searchParams,
}: PageProps<"/kiem-tra-ai-dao-van/ket-qua/[ref]">) {
  const { ref } = await params;
  const query = await searchParams;
  const cancelledCheckout = query.huy === "1";
  const session = await currentSession();
  if (!session?.user?.id) {
    redirect(
      `/dang-nhap?tiep=${encodeURIComponent(`/kiem-tra-ai-dao-van/ket-qua/${ref}`)}`,
    );
  }

  // Truy vấn tự thu hẹp theo chủ đơn. `ref` ngẫu nhiên khiến không ai đếm lên
  // mà tìm được đơn; `userId` khiến một đường link bị chuyển tiếp cũng không mở
  // ra được nội dung. Không tìm thấy và không phải của mình trả về cùng một 404
  // — phân biệt hai trường hợp là tự xác nhận đơn đó có tồn tại.
  const order = await findServiceOrder(ref, session.user.id);
  if (!order) notFound();

  /**
   * Nơi PayOS trả người dùng về khi họ bấm "Hủy" trên đơn dịch vụ.
   *
   * Trước đây `?huy=1` CHỈ đổi bộ chữ trên trang này: đơn ở nguyên `pending` và
   * link PayOS sống tiếp đủ 24 giờ, nên một học viên vừa bấm "Hủy" vẫn có thể
   * chuyển khoản cho một đơn họ tin là đã bỏ. Giờ nó hủy thật.
   *
   * Điều kiện là `?id` khớp `providerRef`, đúng chốt CSRF của
   * `app/thanh-toan/huy/page.tsx` và vì đúng lý do đó: PayOS đính `id` —
   * `paymentLinkId` 32 ký tự hex, không đoán được — vào cả `cancelUrl`, còn
   * `?huy=1` một mình thì ai cũng gõ ra được. `ref` trong đường dẫn là 16 byte
   * ngẫu nhiên nên nó không lộ như `Order.code`, nhưng nó vẫn lộ qua lịch sử
   * duyệt và qua một liên kết bị chuyển tiếp.
   */
  let status = order.status;
  const paymentLinkId = typeof query.id === "string" ? query.id : null;
  const proven =
    status === "pending" &&
    paymentLinkId !== null &&
    order.providerRef !== null &&
    paymentLinkId === order.providerRef;

  if (proven) {
    if (await allowUserAction("service_order_cancel", session.user.id, 10)) {
      const result = await cancelServiceOrder(order.id, { userId: session.user.id });
      if (result.cancelled) status = "cancelled";
    }
  } else if (status === "pending") {
    // Không khớp `id` thì vẫn hỏi PayOS — chỉ đọc, không hủy gì ngoài kia. Đây
    // là đường bắt được các lối thoát không sinh redirect: đóng tab, app ngân
    // hàng nuốt deep link, hoặc hủy ở một thiết bị khác.
    const synced = await syncPayosServiceOrderStatus(order.id, {
      userId: session.user.id,
    });
    if (synced.closed) status = synced.as;
  }

  const kindLabel = serviceKindLabel(order.kind);
  const view = serviceOrderView({ ...order, status }, new Date(), cancelledCheckout);
  let title: string;
  let subtitle: string;
  switch (view) {
    case "paid":
      title = aiCheck.result.paidTitle;
      subtitle = aiCheck.result.paidBody;
      break;
    case "cancelled":
      title = aiCheck.result.releasedTitle;
      subtitle = aiCheck.result.releasedBody;
      break;
    case "cancelled_checkout":
      title = aiCheck.result.cancelledTitle;
      subtitle = aiCheck.result.cancelledBody;
      break;
    case "open":
      title = aiCheck.result.pendingTitle;
      subtitle = aiCheck.result.pendingBody;
      break;
    case "closed":
      title = aiCheck.result.closedTitle;
      subtitle = aiCheck.result.closedBody;
      break;
  }
  const checkoutOpen = view === "open" || view === "cancelled_checkout";

  return (
    <Section soft>
      <SectionHeading
        eyebrow={aiCheck.result.eyebrow}
        title={title}
        subtitle={subtitle}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-line bg-card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {aiCheck.result.codeLabel}
            </p>
            <Badge tone={orderStatusTone[status] ?? "cool"}>
              {orderStatusLabel[status] ?? status}
            </Badge>
          </div>

          <div className="mt-3">
            <CopyCode code={order.code} />
          </div>

          <dl className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5">
              <dt className="text-[13px] text-fg-muted">Dịch vụ</dt>
              <dd className="text-[15px] font-semibold text-fg">{kindLabel}</dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5">
              <dt className="text-[13px] text-fg-muted">Độ dài</dt>
              <dd className="text-[15px] font-semibold text-fg">
                {order.wordCount.toLocaleString("vi-VN")} từ
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
              <dt className="text-[13px] text-fg-muted">Chi phí</dt>
              <dd className="text-[15px] font-bold text-fg">
                {formatVnd(order.amountVnd)}
              </dd>
            </div>
          </dl>

          {checkoutOpen && order.checkoutUrl && (
            <PayosLink
              href={order.checkoutUrl}
              handoff={{ kind: "service", key: ref }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Mở lại trang thanh toán
              <IconArrow size={16} />
            </PayosLink>
          )}
          {view === "open" && (
            <PaymentPoll
              statusUrl={`/api/trang-thai-don?dichVu=${ref}`}
              // Cùng tham số `false` mà endpoint dùng: cờ `huy=1` nằm
              // trên URL của trình duyệt, không phải trạng thái server.
              banDau={serviceOrderView({ ...order, status }, new Date(), false)}
            />
          )}
          {checkoutOpen && <CancelServiceOrder orderId={order.id} />}
          {view === "closed" && (
            <Link
              href="/kiem-tra-ai-dao-van"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              {aiCheck.result.back}
              <IconArrow size={16} />
            </Link>
          )}
        </div>

        <div className="rounded-card border border-line bg-card p-6 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
            {aiCheck.result.sendTitle}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
            {aiCheck.result.sendBody}
          </p>
          <a
            href={links.zalo}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
          >
            <IconMessage size={16} />
            {aiCheck.result.sendCta}
          </a>
          <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
            Nhắn kèm mã #{order.code} để HDI đối chiếu với khoản đã thanh toán.
          </p>
        </div>
      </div>
    </Section>
  );
}
