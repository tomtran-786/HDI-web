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
