/**
 * 404: căn trái như mọi tiêu đề khác. Không có nút "Về trang chủ" — breadcrumb
 * ngay phía trên đã là lối về (tests/fallback-actions.test.tsx).
 */
export default function NotFound() {
  return (
    <section className="bg-bg">
      <div className="shell py-16 sm:py-20 lg:py-24">
        <h1 className="max-w-[22ch] text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-5xl">
          Không tìm thấy trang
        </h1>
        <p className="mt-4 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
          <span className="font-cond font-semibold text-fg">Lỗi 404.</span> Đường dẫn
          này không tồn tại, đã được chuyển đi hoặc bạn không có quyền xem nội dung đó.
        </p>
      </div>
    </section>
  );
}
