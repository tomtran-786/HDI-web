/**
 * Họa tiết vòng tròn đồng tâm ở góc trên phải và dưới trái của một band navy —
 * thay cho ảnh `quad-circle.png` của Analyst Academy, vẽ bằng SVG nên không
 * thêm asset. Phần tử cha phải `relative overflow-hidden`.
 */
const RADII = [60, 100, 140, 180, 220];

function Rings({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 440 440"
      className={`pointer-events-none absolute h-72 w-72 sm:h-96 sm:w-96 ${className}`}
    >
      {RADII.map((r) => (
        <circle
          key={r}
          cx="220"
          cy="220"
          r={r}
          fill="none"
          stroke="#fff"
          strokeOpacity="0.06"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

export function CornerRings() {
  return (
    <>
      <Rings className="-right-24 -top-24 sm:-right-32 sm:-top-32" />
      <Rings className="-bottom-24 -left-24 sm:-bottom-32 sm:-left-32" />
    </>
  );
}
