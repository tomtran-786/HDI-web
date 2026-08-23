import { IconStar } from "./icons";

/**
 * Năm ngôi sao, tô theo đúng phần lẻ của điểm trung bình.
 *
 * Hai hàng sao chồng lên nhau — hàng rỗng nằm dưới, hàng đầy nằm trên và bị cắt
 * theo tỉ lệ — chứ không làm tròn về sao nguyên. Làm tròn nghe thì gọn, nhưng
 * nó biến 4,4 và 4,6 thành cùng một hình: con số duy nhất mà người đọc dùng để
 * so hai khóa học sẽ mất đi đúng phần phân biệt được chúng.
 *
 * Màu KHÔNG phải là thông tin ở đây: `aria-label` nói ra điểm số, và số lượt
 * đánh giá luôn được in bằng chữ ngay cạnh, nên người không phân biệt được sắc
 * vàng/xám vẫn đọc được đầy đủ.
 */
export function Stars({
  value,
  size = 15,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const ratio = Math.max(0, Math.min(1, value / 5));
  const stars = [0, 1, 2, 3, 4];

  return (
    <span
      role="img"
      aria-label={`${value.toFixed(1)} trên 5 sao`}
      className={`relative inline-flex shrink-0 ${className}`}
    >
      <span className="flex text-line" aria-hidden>
        {stars.map((i) => (
          <IconStar key={i} size={size} className="shrink-0" />
        ))}
      </span>
      {/* Lớp phủ: cùng năm ngôi sao, tô đầy, cắt bằng chiều rộng. `overflow`
          cắt theo pixel nên nó đúng cả khi cỡ chữ của trình duyệt bị phóng to. */}
      <span
        className="absolute inset-y-0 left-0 flex overflow-hidden text-warning"
        style={{ width: `${ratio * 100}%` }}
        aria-hidden
      >
        {stars.map((i) => (
          <IconStar key={i} size={size} filled className="shrink-0" />
        ))}
      </span>
    </span>
  );
}
