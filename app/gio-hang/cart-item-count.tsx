"use client";

import { useCart } from "@/components/cart-provider";
import { cartPage } from "@/content/checkout";

/**
 * "3 khóa" ở góc phải đầu trang giỏ hàng. Tách thành client component riêng để
 * phần còn lại của header vẫn render ở server: số khóa đọc từ cookie qua
 * CartProvider, nên nó đổi ngay khi bấm "Xóa" mà không cần tải lại trang.
 */
export function CartItemCount() {
  const { count } = useCart();
  return <span>{cartPage.itemCount(count)}</span>;
}
