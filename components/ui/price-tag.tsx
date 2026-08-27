import type { Course } from "@/content/course";
import { Badge } from "./badge";

/**
 * Con số học phí, ở đúng một chỗ cho cả bốn nơi in nó ra.
 *
 * Khi khóa có `deal`, cách trình bày là một quyết định marketing của chủ dự
 * án: giá ưu đãi là con số to nhất, giá gốc đứng ngay cạnh với cỡ chữ nhỏ hơn
 * và bị gạch ngang. Mức tiết kiệm chỉ có tác dụng khi người đọc thấy được cả
 * hai con số cùng lúc.
 *
 * Điều kiện hưởng ưu đãi ("nhóm từ 03 bạn") đi liền con số lớn chứ không nằm ở
 * dòng chú thích bên dưới. Con số to nhất trên trang là con số người ta nhớ,
 * nên nếu điều kiện tách rời khỏi nó thì người mua lẻ sẽ tới bước thanh toán
 * mới biết mình trả một mức giá khác.
 */
export function PriceTag({
  price,
  size = "lg",
}: {
  price: Course["price"];
  /** `lg` cho thẻ khóa và card học phí; `sm` cho một hàng trong bảng. */
  size?: "lg" | "sm";
}) {
  const { deal } = price;
  const leadClass =
    size === "lg"
      ? "text-2xl font-bold tracking-tight text-primary sm:text-3xl"
      : "text-lg font-bold text-primary";
  const struckClass =
    size === "lg"
      ? "text-base font-semibold text-fg-subtle line-through"
      : "text-sm font-semibold text-fg-subtle line-through";

  if (!deal) {
    return <p className={leadClass}>{price.amount}</p>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <p className={leadClass}>{deal.amount}</p>
      {/* `line-through` một mình không nói với trình đọc màn hình rằng đây là
          giá cũ, nên `<s>` mang ngữ nghĩa và nhãn ẩn mang lời giải thích. */}
      <s className={struckClass}>
        <span className="sr-only">Giá gốc </span>
        {price.amount}
      </s>
      <Badge tone="success">{deal.condition}</Badge>
    </div>
  );
}
