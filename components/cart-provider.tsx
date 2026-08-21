"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
import { CartModal } from "./cart-modal";

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
  openCart: (courseSlug?: string) => void;
  closeCart: () => void;
};

const Ctx = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = useMemo(() => parseCart(raw), [raw]);
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [focusSlug, setFocusSlug] = useState<string | null>(null);

  // Checkout clears the cart from the server, where this component cannot
  // observe the write. A navigation is the one moment that can have happened,
  // so nudge the store to re-read then — otherwise the header badge keeps
  // showing three items on the order confirmation page.
  useEffect(() => {
    emit();
  }, [pathname]);

  // Authentication and profile-completion routes return here with these
  // short-lived controls. Open once, then leave the canonical landing URL in
  // the address bar without causing another navigation or server render.
  useEffect(() => {
    if (pathname !== "/") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("cart") !== "1") return;
    const course = url.searchParams.get("course");
    // Strip the parameters only once the modal is actually opening. Clearing
    // them up here instead loses the handoff whenever this effect runs twice:
    // the cleanup cancels the pending frame, and the second pass reads a URL
    // the first already emptied. React's StrictMode does exactly that on every
    // development mount, which left a student returning from login staring at
    // the plain landing page with no cart in sight.
    const frame = window.requestAnimationFrame(() => {
      url.searchParams.delete("cart");
      url.searchParams.delete("course");
      window.history.replaceState(window.history.state, "", url);
      setFocusSlug(course);
      setModalOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
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
  const openCart = useCallback((courseSlug?: string) => {
    emit();
    setFocusSlug(courseSlug ?? null);
    setModalOpen(true);
  }, []);
  const closeCart = useCallback(() => setModalOpen(false), []);

  const value = useMemo<CartContext>(
    () => ({
      ids,
      count: ids.length,
      full: ids.length >= CART_MAX_ITEMS,
      has: (id: string) => ids.includes(id),
      add,
      remove,
      clear,
      openCart,
      closeCart,
    }),
    [ids, add, remove, clear, openCart, closeCart],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {modalOpen && (
        <CartModal
          open
          focusSlug={focusSlug}
          ids={ids}
          full={ids.length >= CART_MAX_ITEMS}
          add={add}
          remove={remove}
          onClose={closeCart}
        />
      )}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart phải nằm trong <CartProvider>.");
  return ctx;
}
