"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  CART_COOKIE,
  CART_MAX_AGE,
  CART_MAX_ITEMS,
  parseCart,
  serializeCart,
} from "@/lib/cart-cookie";

// --- the cookie, as an external store --------------------------------------
//
// The cart genuinely lives outside React: the server writes it too (checkout
// empties it), and a copy held in useState would go stale the moment that
// happened. useSyncExternalStore is the primitive for exactly this, and it also
// solves hydration for free — it renders the server snapshot first, so the
// markup matches, then swaps in the real value.

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A string, not an array: the snapshot has to be referentially stable. */
function getSnapshot() {
  const prefix = `${CART_COOKIE}=`;
  const hit = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  return hit ? decodeURIComponent(hit.slice(prefix.length)) : "";
}

/** No cookie is readable while rendering on the server. */
function getServerSnapshot() {
  return "";
}

function writeCookie(ids: string[]) {
  // max-age 0 deletes it — an empty cart should leave no cookie behind.
  const age = ids.length > 0 ? CART_MAX_AGE : 0;
  document.cookie = `${CART_COOKIE}=${serializeCart(ids)}; path=/; max-age=${age}; samesite=lax`;
  emit();
}

type CartContext = {
  ids: string[];
  count: number;
  full: boolean;
  has: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = useMemo(() => parseCart(raw), [raw]);
  const pathname = usePathname();

  // Checkout clears the cart from the server, where this component cannot
  // observe the write. A navigation is the one moment that can have happened,
  // so nudge the store to re-read then — otherwise the header badge keeps
  // showing three items on the order confirmation page.
  useEffect(() => {
    emit();
  }, [pathname]);

  const add = useCallback((id: string) => {
    const current = parseCart(getSnapshot());
    if (current.includes(id) || current.length >= CART_MAX_ITEMS) return;
    writeCookie([...current, id]);
  }, []);

  const remove = useCallback((id: string) => {
    writeCookie(parseCart(getSnapshot()).filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => writeCookie([]), []);

  const value = useMemo<CartContext>(
    () => ({
      ids,
      count: ids.length,
      full: ids.length >= CART_MAX_ITEMS,
      has: (id: string) => ids.includes(id),
      add,
      remove,
      clear,
    }),
    [ids, add, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart phải nằm trong <CartProvider>.");
  return ctx;
}
