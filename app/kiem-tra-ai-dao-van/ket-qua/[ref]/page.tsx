import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aiCheck, aiCheckKinds } from "@/content/ai-check";
import { orderStatusLabel, orderStatusTone } from "@/content/checkout";
import { links } from "@/content/site";
import { formatVnd } from "@/lib/format";
import { findServiceOrder } from "@/lib/service-orders";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeading } from "@/components/ui/section";
import { IconArrow, IconMessage } from "@/components/ui/icons";
import { CopyCode } from "./copy-code";

export const metadata: Metadata = {
  title: "Đơn dịch vụ — HDI Research Center",
  // Trang của một đơn cụ thể, không phải nội dung để tìm thấy trên Google.
  robots: { index: false, follow: false },
};

export default async function ServiceOrderResultPage({
  params,
}: PageProps<"/kiem-tra-ai-dao-van/ket-qua/[ref]">) {
  const { ref } = await params;
  // `ref` là 16 byte ngẫu nhiên chứ không phải mã đơn tuần tự, nên trang này
  // không mở được bằng cách đếm lên — đó là lý do nó không cần đăng nhập.
  const order = await findServiceOrder(ref);
  if (!order) notFound();

  const kindLabel =
    aiCheckKinds.find((kind) => kind.id === order.kind)?.label ?? order.kind;
  const paid = order.status === "paid";
  const open = order.status === "pending" && order.expiresAt > new Date();

  return (
    <Section soft>
      <SectionHeading
        eyebrow={aiCheck.result.eyebrow}
        title={
          paid
            ? aiCheck.result.paidTitle
            : open
              ? aiCheck.result.pendingTitle
              : aiCheck.result.closedTitle
        }
        subtitle={
          paid
            ? aiCheck.result.paidBody
            : open
              ? aiCheck.result.pendingBody
              : aiCheck.result.closedBody
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-line bg-card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {aiCheck.result.codeLabel}
            </p>
            <Badge tone={orderStatusTone[order.status] ?? "cool"}>
              {orderStatusLabel[order.status] ?? order.status}
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

          {open && order.checkoutUrl && (
            <a
              href={order.checkoutUrl}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Mở lại trang thanh toán
              <IconArrow size={16} />
            </a>
          )}
          {!open && !paid && (
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
