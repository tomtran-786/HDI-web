export type PublicAvailability = "buyable" | "not_open" | "full";

/**
 * Thẻ khóa học trên trang chủ trình bày ra sao.
 *
 * `undefined` nghĩa là KHÔNG ĐỌC ĐƯỢC, không phải "đóng". Hai thứ đó từng cùng
 * rơi vào một nhánh, nên một lần Supabase chớp làm cả sáu khóa hiện "chưa mở
 * đăng ký". Ở đây chọn fail-open: `createOrder` khóa dòng và đếm ghế thật, nên
 * một cú bấm thừa tốn đúng một thông báo, còn một cửa hàng đóng sạch thì tốn
 * mọi đơn hàng trong lúc sự cố.
 */
export function cardPresentation(
  availability: PublicAvailability | undefined,
) {
  if (!availability) return { badge: null, buyable: true } as const;
  return {
    badge: availability,
    buyable: availability === "buyable",
  } as const;
}

/**
 * Khóa này có được phép hiện ở front-end không.
 *
 * Chỉ ẩn khi BIẾT CHẮC khóa là `not_open` — gồm cả khóa không có dòng nào trong
 * DB, vì đó cũng là khóa chưa mở bán (xem `computeCourseSales`). `null` là "không
 * đọc được dữ liệu", và cùng lý do fail-open ở `cardPresentation`: một lần DB
 * chớp không được làm cả cửa hàng biến mất. Khóa `full` vẫn hiện, kèm badge, vì
 * nó đã mở bán.
 */
export function isListed(
  availability: Record<string, PublicAvailability> | null | undefined,
  slug: string,
): boolean {
  if (!availability) return true;
  return (availability[slug] ?? "not_open") !== "not_open";
}

/** Slug (trong `slugs`) cần ẩn; rỗng khi không đọc được dữ liệu. */
export function hiddenSlugs(
  availability: Record<string, PublicAvailability> | null | undefined,
  slugs: readonly string[],
): string[] {
  return slugs.filter((slug) => !isListed(availability, slug));
}
