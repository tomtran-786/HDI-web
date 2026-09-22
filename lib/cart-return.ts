/**
 * Đích quay về giỏ hàng, giữ nguyên khóa mà người mua đang nhắm tới.
 *
 * Dùng chung cho hai cổng dẫn ra khỏi giỏ hàng: cổng server ở
 * `app/gio-hang/page.tsx` và đường 401/409 của `app/gio-hang/cart-client.tsx`.
 * Trước đây mỗi bên tự dựng URL riêng và chỉ một bên nhớ giữ `?course=`.
 *
 * Không tự kiểm tra slug — nó chỉ dùng để cuộn tới đúng thẻ khóa, và bên gọi
 * ở phía server vẫn cho kết quả đi qua `safeNext`.
 */
export function cartReturnTo(focusSlug: string | null) {
  return focusSlug
    ? `/gio-hang?course=${encodeURIComponent(focusSlug)}`
    : "/gio-hang";
}
