"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { checkout, type CheckoutState } from "@/app/actions/checkout";
import { useRouter } from "next/navigation";
import type { CatalogCourse, CourseAvailability } from "@/lib/cart";
import { formatVnd } from "@/lib/format";
import { trackCartAdd, trackCartRemove, trackCheckout } from "@/lib/analytics";
import { cartModal } from "@/content/checkout";
import { IconCart, IconClose } from "./ui/icons";

type CatalogResponse = { catalog: CatalogCourse[]; staleIds: string[] };

const availabilityLabel: Record<CourseAvailability, string> = {
  ...cartModal.availability,
};

function returnTo(focusSlug: string | null) {
  const query = new URLSearchParams({ cart: "1" });
  if (focusSlug) query.set("course", focusSlug);
  return `/?${query.toString()}`;
}

export function CartModal({
  open,
  focusSlug,
  ids,
  full,
  add,
  remove,
  onClose,
}: {
  open: boolean;
  focusSlug: string | null;
  ids: string[];
  full: boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pruned, setPruned] = useState(false);
  const [state, action, checkoutPending] = useActionState<CheckoutState, FormData>(
    checkout,
    {},
  );

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setPruned(false);
    try {
      const response = await fetch("/api/gio-hang", { cache: "no-store" });
      if (response.status === 401 || response.status === 409) {
        const destination = returnTo(focusSlug);
        const gate = response.status === 401 ? "/dang-nhap" : "/hoan-tat-ho-so";
        onClose();
        router.push(`${gate}?tiep=${encodeURIComponent(destination)}`);
        return;
      }
      if (!response.ok) throw new Error(`catalog_${response.status}`);
      const data = (await response.json()) as CatalogResponse;
      setCatalog(data.catalog);
      if (data.staleIds.length > 0) {
        for (const id of data.staleIds) remove(id);
        setPruned(true);
      }
    } catch (error) {
      console.error("[cart] Không tải được danh sách khóa:", error);
      setLoadError(cartModal.loadError);
    } finally {
      setLoading(false);
    }
  }, [focusSlug, onClose, remove, router]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      void loadCatalog();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, loadCatalog]);

  useEffect(() => {
    if (!state.refreshCatalog || !open) return;
    const frame = window.requestAnimationFrame(() => void loadCatalog());
    return () => window.cancelAnimationFrame(frame);
  }, [state, open, loadCatalog]);

  useEffect(() => {
    if (!focusSlug || catalog.length === 0) return;
    document.getElementById(`cart-course-${focusSlug}`)?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [catalog, focusSlug]);

  const byId = useMemo(
    () => new Map(catalog.flatMap((course) => (course.id ? [[course.id, course] as const] : []))),
    [catalog],
  );
  const selected = ids.flatMap((id) => {
    const course = byId.get(id);
    return course?.availability === "buyable" ? [course] : [];
  });
  const totalVnd = selected.reduce((sum, course) => sum + course.priceVnd, 0);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cart-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className="w-[calc(100vw-1rem)] max-w-4xl sm:w-[calc(100vw-2rem)]"
    >
      <div className="flex min-h-[min(42rem,85vh)] flex-col">
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-line bg-card px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {cartModal.eyebrow}
            </p>
            <h2 id="cart-modal-title" className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl">
              {cartModal.title}
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              {cartModal.intro}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={cartModal.close}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition hover:border-primary hover:text-primary"
          >
            <IconClose />
          </button>
        </div>

        <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="px-5 py-5 sm:px-7">
            {pruned && (
              <p role="status" className="mb-4 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
                {cartModal.pruned}
              </p>
            )}
            {(loadError || state.error) && (
              <p role="alert" className="mb-4 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-danger">
                {state.error ?? loadError}
              </p>
            )}

            {loading && catalog.length === 0 ? (
              <div className="space-y-3" aria-label={cartModal.loading}>
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-card bg-bg-soft" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {catalog.map((course) => {
                  const buyable = course.availability === "buyable" && Boolean(course.id);
                  const checked = Boolean(course.id && ids.includes(course.id));
                  return (
                    <li
                      id={`cart-course-${course.slug}`}
                      key={course.slug}
                      className={`rounded-card border p-4 transition sm:p-5 ${
                        checked ? "border-primary bg-tint" : "border-line bg-card"
                      } ${buyable ? "" : "opacity-70"}`}
                    >
                      <label className={buyable ? "flex cursor-pointer gap-4" : "flex cursor-not-allowed gap-4"}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!buyable || (!checked && full)}
                          onChange={() => {
                            if (!course.id) return;
                            if (checked) {
                              remove(course.id);
                              trackCartRemove(course.slug);
                            } else {
                              add(course.id);
                              trackCartAdd(course.slug);
                            }
                          }}
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold leading-snug tracking-tight text-fg">
                            {course.title}
                          </span>
                          <span className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className={`text-sm font-semibold ${buyable ? "text-success" : "text-fg-subtle"}`}>
                              {availabilityLabel[course.availability]}
                              {buyable && course.seatsLeft !== null ? ` · còn ${course.seatsLeft} chỗ` : ""}
                            </span>
                            <span className="text-lg font-bold text-primary">
                              {formatVnd(course.priceVnd)}
                            </span>
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="border-t border-line bg-bg-soft px-5 py-5 lg:border-l lg:border-t-0 sm:px-7 lg:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {cartModal.selected} · {selected.length} khóa
            </p>
            {selected.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                {cartModal.empty}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {selected.map((course) => (
                  <li key={course.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="leading-snug text-fg-muted">{course.title}</span>
                    <span className="shrink-0 font-semibold text-fg">{formatVnd(course.priceVnd)}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-line bg-card px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">{cartModal.total}</p>
              <p className="text-2xl font-bold tracking-tight text-primary">{formatVnd(totalVnd)}</p>
            </div>
            <form action={action}>
              <button
                type="submit"
                disabled={selected.length === 0 || loading || checkoutPending}
                onClick={() => trackCheckout(selected.length, totalVnd)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <IconCart size={16} />
                {checkoutPending ? cartModal.paying : `${cartModal.checkout} · ${formatVnd(totalVnd)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </dialog>
  );
}
