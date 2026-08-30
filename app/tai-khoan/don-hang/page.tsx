import type { Metadata } from "next";
import Link from "next/link";
import { currentSession } from "@/lib/current-session";
import { prisma } from "@/lib/prisma";
import { courseSummaryLine } from "@/lib/courses";
import { formatDate, formatDateTime, formatVnd } from "@/lib/format";
import {
  groupPanel,
  orderPage,
  orderStatusLabel,
  orderStatusTone,
} from "@/content/checkout";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { IconArrow } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Đơn hàng — HDI Research Center",
  robots: { index: false, follow: false },
};

export default async function OrderListPage() {
  const session = await currentSession();
  // The layout already redirected; this is for TypeScript.
  if (!session?.user?.id) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      status: true,
      amountVnd: true,
      createdAt: true,
      expiresAt: true,
      groupSize: true,
      items: {
        // No `course: true`: that would drag meetingUrl and driveFolderId into
        // the payload of a page anyone with a pending order can load.
        select: { id: true, course: { select: { code: true, slug: true } } },
      },
    },
  });

  return (
    <Section soft>
      <SectionHeading
        eyebrow={orderPage.eyebrow}
        title={orderPage.listTitle}
        subtitle="Lịch sử đặt chỗ và trạng thái thanh toán."
      />

      {orders.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-8 text-center sm:p-10">
          <p className="text-lg font-bold tracking-tight">
            {orderPage.listEmpty}
          </p>
          <Link
            href="/khoa-hoc"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
          >
            Xem các khóa học
            <IconArrow size={16} />
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/tai-khoan/don-hang/${order.code}`}
                className="flex flex-col gap-4 rounded-card border border-line bg-card p-5 transition hover:border-primary sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold tabular-nums tracking-tight">
                      #{order.code}
                    </p>
                    <Badge tone={orderStatusTone[order.status] ?? "cool"}>
                      {orderStatusLabel[order.status] ?? order.status}
                    </Badge>
                    {/* Đơn nhóm có một dòng item cho mỗi người, nên nếu không
                        nói ra số người thì tổng tiền trông như gấp mấy lần giá
                        khóa mà không có gì giải thích. */}
                    {order.groupSize > 1 && (
                      <Badge tone="cool">{groupPanel.size(order.groupSize)}</Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13px] text-fg-muted">
                    {courseSummaryLine(order.items)}
                  </p>
                  <p className="mt-1 text-[13px] text-fg-subtle">
                    Đặt ngày {formatDate(order.createdAt)}
                    {order.status === "pending" &&
                      ` · ${orderPage.holdUntil} ${formatDateTime(order.expiresAt)}`}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-bold tracking-tight text-primary">
                  {formatVnd(order.amountVnd)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
