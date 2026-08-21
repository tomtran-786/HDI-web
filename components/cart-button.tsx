"use client";

import { useCart } from "./cart-provider";
import { IconCart } from "./ui/icons";

/**
 * The header's cart affordance.
 *
 * Rendered at all times rather than appearing only when the cart is non-empty:
 * a control that comes and goes is one people stop looking for. The badge is
 * absent from the server's markup and appears after hydration — that is what
 * useSyncExternalStore's server snapshot buys.
 */
export function CartButton({ onNavigate }: { onNavigate?: () => void }) {
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        openCart();
      }}
      aria-label={count > 0 ? `Giỏ hàng, ${count} khóa học` : "Giỏ hàng"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-muted transition hover:border-primary hover:text-primary"
    >
      <IconCart size={17} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-fg">
          {count}
        </span>
      )}
    </button>
  );
}
