import type { CourseCover } from "@/content/course";
import { findCourse } from "./courses";

export type OrderLine = {
  code: string;
  slug: string;
  title: string;
  /** Vắng mặt khi khóa không còn trong content/course.ts. */
  cover?: CourseCover;
  schedule: string | null;
  format: string | null;
  /** Giá MỘT ghế đã chốt trên dòng đơn (không phải giá hiện hành của khóa). */
  unitVnd: number;
  /** Số ghế (= số người học) của khóa này trong đơn. */
  learners: number;
  /** Tên hiển thị của từng người học, chỉ có khi đơn nhóm và biết `viewerId`. */
  members: string[];
};

type OrderItemInput = {
  priceVnd: number;
  memberUserId?: string | null;
  member?: { email: string } | null;
  course: { code: string; slug: string };
};

/**
 * Gộp các dòng đơn theo khóa cho phần hiển thị.
 *
 * Một đơn nhóm giữ MỘT ghế cho mỗi người, nên ba người mua cùng một khóa là ba
 * `order_items`; in từng dòng một sẽ lặp tên khóa ba lần. Gộp lại thì mỗi khóa
 * một dòng kèm số người học. Giá lấy từ SNAPSHOT trên dòng đơn chứ không từ khóa
 * hiện tại: số tiền người ta đã đồng ý không được đổi theo bảng giá sau đó.
 */
export function orderLines(
  items: readonly OrderItemInput[],
  viewerId?: string,
): OrderLine[] {
  const byCode = new Map<string, OrderLine>();
  for (const item of items) {
    const existing = byCode.get(item.course.code);
    const memberName =
      viewerId && item.memberUserId !== undefined
        ? item.memberUserId === viewerId
          ? "bạn"
          : (item.member?.email ?? null)
        : null;
    if (existing) {
      existing.learners += 1;
      if (memberName) existing.members.push(memberName);
      continue;
    }
    const authored = findCourse(item.course.slug);
    byCode.set(item.course.code, {
      code: item.course.code,
      slug: item.course.slug,
      title: authored?.title ?? item.course.slug,
      cover: authored?.cover,
      schedule: authored?.facts.find((fact) => fact.label === "Lịch học")?.value ?? null,
      format: authored?.facts.find((fact) => fact.label === "Hình thức")?.value ?? null,
      unitVnd: item.priceVnd,
      learners: 1,
      members: memberName ? [memberName] : [],
    });
  }
  return [...byCode.values()];
}

/**
 * Các dòng tiền của một đơn, từ các con số ĐÃ GHI trên đơn.
 *
 * Tạm tính là tổng giá các ghế (đã gồm ưu đãi nhóm — snapshot trên dòng đơn);
 * hai khoản trừ ở mức đơn được kể tên riêng để hóa đơn cộng lại được.
 */
export function orderMoney(order: {
  amountVnd: number;
  referralDiscountVnd: number;
  creditAppliedVnd: number;
}) {
  return {
    subtotalVnd:
      order.amountVnd + order.referralDiscountVnd + order.creditAppliedVnd,
    referralDiscountVnd: order.referralDiscountVnd,
    creditAppliedVnd: order.creditAppliedVnd,
    totalVnd: order.amountVnd,
  };
}
