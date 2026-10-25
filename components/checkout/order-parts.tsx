import { Badge } from "@/components/ui/badge";
import {
  cartPage,
  groupOrderLabel,
  orderStatusLabel,
  orderStatusTone,
  referralPanel,
} from "@/content/checkout";
import { formatVnd } from "@/lib/format";
import { orderLines, orderMoney } from "@/lib/order-lines";
import { LineItem } from "./line-item";
import type { SummaryLine } from "./summary-card";

type Items = Parameters<typeof orderLines>[0];

/**
 * Danh sách khóa trong một đơn, dùng cho cả ba trang đơn/thanh toán. Chỉ đọc:
 * không có nút "Xóa", và khóa không còn mua được không thể xuất hiện ở đây vì
 * đơn đã chốt. Đơn nhóm in thêm ai là người học của từng khóa.
 */
export function OrderLineList({
  items,
  viewerId,
}: {
  items: Items;
  viewerId?: string;
}) {
  return (
    <ul className="divide-y divide-line">
      {orderLines(items, viewerId).map((line) => (
        <LineItem
          key={line.code}
          course={line}
          unitVnd={line.unitVnd}
          learners={line.learners}
        >
          {line.members.length > 0 && (
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              {groupOrderLabel.learner}: {line.members.join(", ")}
            </p>
          )}
        </LineItem>
      ))}
    </ul>
  );
}

/** Tạm tính, giảm giới thiệu, credits của một đơn — bằng các con số đã ghi trên đơn. */
export function orderSummaryLines(order: {
  amountVnd: number;
  referralDiscountVnd: number;
  creditAppliedVnd: number;
}): { lines: SummaryLine[]; total: { label: string; value: string } } {
  const money = orderMoney(order);
  return {
    lines: [
      { key: "subtotal", label: cartPage.subtotal, value: formatVnd(money.subtotalVnd) },
      ...(money.referralDiscountVnd > 0
        ? [
            {
              key: "referral",
              label: referralPanel.discountLine,
              value: `−${formatVnd(money.referralDiscountVnd)}`,
              tone: "discount" as const,
            },
          ]
        : []),
      ...(money.creditAppliedVnd > 0
        ? [
            {
              key: "credits",
              label: referralPanel.creditLine,
              value: `−${formatVnd(money.creditAppliedVnd)}`,
              tone: "discount" as const,
            },
          ]
        : []),
    ],
    total: { label: cartPage.total, value: formatVnd(money.totalVnd) },
  };
}

/** Badge trạng thái đơn (+ badge nhóm) ở đầu thẻ tóm tắt. */
export function OrderStatusBadges({
  status,
  groupSize,
}: {
  status: string;
  groupSize: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={orderStatusTone[status] ?? "cool"}>
        {orderStatusLabel[status] ?? status}
      </Badge>
      {groupSize > 1 && <Badge tone="cool">Nhóm {groupSize} người</Badge>}
    </div>
  );
}
