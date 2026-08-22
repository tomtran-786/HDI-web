/**
 * The cart's wire format, shared by the browser and the server.
 *
 * A cart is a list of course ids in a cookie — nothing else. No prices, no
 * totals, no user id. That is deliberate: the cookie is fully under the
 * visitor's control, so the only safe thing to keep in it is a list of things
 * to *look up*. Every number a student is asked to pay is recomputed from the
 * database at checkout, which means tampering with this cookie can change what
 * is in the basket and never what it costs.
 *
 * It is also readable by JavaScript on purpose (no httpOnly). The header badge
 * has to update the moment something is added, and there is no secret here to
 * protect.
 */

export const CART_COOKIE = "hdi-gio-hang";

/** Beyond this the cookie stops being a cart and starts being a mistake. */
export const CART_MAX_ITEMS = 8;

export const CART_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * The shape of a cuid, which is what every id in this schema is.
 *
 * Exported because Server Actions need the same test: an id arriving in an RSC
 * action payload is exactly as attacker-controlled as one arriving in this
 * cookie, and two copies of this regex would drift.
 */
export const ID_RE = /^[a-z0-9]{20,36}$/i;

/**
 * Order is preserved and duplicates collapse — a cart is a set, and adding the
 * same intake twice is never what anyone meant.
 */
export function parseCart(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    // Anything that is not id-shaped is dropped rather than passed to the
    // database: a hand-edited cookie should be inert, not an error page.
    if (!ID_RE.test(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= CART_MAX_ITEMS) break;
  }
  return out;
}

export function serializeCart(ids: string[]): string {
  return ids.slice(0, CART_MAX_ITEMS).join(",");
}
