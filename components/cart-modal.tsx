"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { checkout, type CheckoutState } from "@/app/actions/checkout";
import { useRouter } from "next/navigation";
import type { CatalogCourse, CourseAvailability } from "@/lib/cart";
import { formatVnd } from "@/lib/format";
import { trackCartAdd, trackCartRemove, trackCheckout } from "@/lib/analytics";
import { cartModal, groupPanel } from "@/content/checkout";
import { GROUP_MIN_SIZE, GROUP_MAX_SIZE, seatPriceVnd } from "@/lib/group-pricing";
import { IconCart, IconClose } from "./ui/icons";

type CatalogResponse = { catalog: CatalogCourse[]; staleIds: string[] };

type GroupPreview = {
  groupSize: number;
  discountApplies: boolean;
  members: { email: string; registered: boolean; conflict: boolean }[];
  totalVnd: number;
  blocked: boolean;
};

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
  const [groupOpen, setGroupOpen] = useState(false);
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // Mỗi lượt gọi mang một số thứ tự. Người dùng gõ nhanh hơn mạng trả lời, nên
  // không có nó thì một phản hồi cũ về muộn sẽ ghi đè lên báo giá mới nhất.
  const previewSeq = useRef(0);

  const addMember = useCallback((raw: string) => {
    const parts = raw.split(/[,;\s]+/).map((part) => part.trim().toLowerCase());
    setMemberEmails((current) => {
      const next = [...current];
      for (const part of parts) {
        if (!part || next.includes(part) || next.length >= GROUP_MAX_SIZE - 1) continue;
        next.push(part);
      }
      return next;
    });
    setDraft("");
  }, []);

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

  // Số người tính ngay ở client để giá không nhấp nháy trong lúc chờ preview.
  // Server vẫn phân giải lại từ đầu — đây chỉ là con số để nhìn.
  const groupSize = memberEmails.length + 1;
  const listTotalVnd = selected.reduce(
    (sum, course) => sum + course.priceVnd * groupSize,
    0,
  );
  const localTotalVnd = selected.reduce(
    (sum, course) => sum + seatPriceVnd(course, groupSize) * groupSize,
    0,
  );
  // Ưu tiên con số server vừa trả, nhưng chỉ khi nó còn ứng với đúng nhóm hiện
  // tại — nếu không, một preview cũ sẽ hiện giá của nhóm ít người hơn.
  const totalVnd =
    preview && preview.groupSize === groupSize ? preview.totalVnd : localTotalVnd;
  const discounted = listTotalVnd > totalVnd;
  const anyGroupEligible = selected.some((course) => course.groupEligible);
  const blocked = Boolean(preview && preview.groupSize === groupSize && preview.blocked);

  useEffect(() => {
    if (!open) return;
    const seq = ++previewSeq.current;
    const emails = memberEmails;
    // Mọi setState nằm trong callback của timeout, không nằm thẳng trong thân
    // effect: gọi đồng bộ ở đây là một vòng render thừa cho mỗi phím gõ.
    const timer = window.setTimeout(async () => {
      if (seq !== previewSeq.current) return;
      if (emails.length === 0) {
        setPreview(null);
        setPreviewLoading(false);
        return;
      }
      setPreviewLoading(true);
      try {
        const response = await fetch("/api/gio-hang/nhom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails }),
          cache: "no-store",
        });
        if (seq !== previewSeq.current) return;
        if (!response.ok) {
          setPreview(null);
          return;
        }
        setPreview((await response.json()) as GroupPreview);
      } catch (error) {
        if (seq !== previewSeq.current) return;
        console.error("[cart] Không báo giá được cho nhóm:", error);
        setPreview(null);
      } finally {
        if (seq === previewSeq.current) setPreviewLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [open, memberEmails, ids]);

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
                  <div key={item} className="h-24 animate-pulse rounded-card bg-tint" />
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
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                            Mã khóa {course.code}
                          </span>
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
                {selected.map((course) => {
                  const unit = seatPriceVnd(course, groupSize);
                  return (
                    <li key={course.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="leading-snug text-fg-muted">
                        <span className="font-bold text-fg">{course.code}</span> · {course.title}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-semibold text-fg">{formatVnd(unit)}</span>
                        {unit < course.priceVnd && (
                          <s className="block text-xs font-medium text-fg-subtle">
                            <span className="sr-only">{groupPanel.listPrice} </span>
                            {formatVnd(course.priceVnd)}
                          </s>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {selected.length > 0 && anyGroupEligible && (
              <div className="mt-5 border-t border-line pt-4">
                {!groupOpen ? (
                  <button
                    type="button"
                    onClick={() => setGroupOpen(true)}
                    className="w-full rounded-card border border-primary/40 bg-tint px-3 py-2.5 text-left text-sm font-semibold text-primary transition hover:border-primary"
                  >
                    👥 {groupPanel.invite}
                  </button>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-fg">{groupPanel.title}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setGroupOpen(false);
                          setMemberEmails([]);
                          setDraft("");
                          setPreview(null);
                        }}
                        className="shrink-0 text-xs font-semibold text-fg-subtle underline transition hover:text-primary"
                      >
                        {groupPanel.close}
                      </button>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                      {groupPanel.intro} {groupPanel.requirement}
                    </p>

                    <label className="mt-3 block">
                      <span className="sr-only">{groupPanel.inputLabel}</span>
                      <span className="flex gap-2">
                        <input
                          type="email"
                          value={draft}
                          placeholder={groupPanel.placeholder}
                          onChange={(event) => setDraft(event.target.value)}
                          onBlur={() => draft.trim() && addMember(draft)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                              event.preventDefault();
                              addMember(draft);
                            }
                          }}
                          disabled={memberEmails.length >= GROUP_MAX_SIZE - 1}
                          className="min-w-0 flex-1 rounded-full border border-line bg-card px-3 py-2 text-sm text-fg outline-none transition focus:border-primary disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={() => addMember(draft)}
                          disabled={!draft.trim()}
                          className="shrink-0 rounded-full border border-line px-3 py-2 text-xs font-bold text-fg-muted transition hover:border-primary hover:text-primary disabled:opacity-50"
                        >
                          {groupPanel.add}
                        </button>
                      </span>
                    </label>

                    {memberEmails.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {memberEmails.map((email) => {
                          const row = preview?.members.find((m) => m.email === email);
                          const bad = row && (!row.registered || row.conflict);
                          const note = !row
                            ? null
                            : !row.registered
                              ? groupPanel.unregistered
                              : row.conflict
                                ? groupPanel.conflict
                                : null;
                          return (
                            <li
                              key={email}
                              className={`flex items-start justify-between gap-2 rounded-card border px-2.5 py-1.5 text-xs ${
                                bad ? "border-danger/40 bg-danger/5" : "border-line bg-card"
                              }`}
                            >
                              <span className="min-w-0 flex-1 leading-snug">
                                <span className="block truncate font-semibold text-fg">
                                  {bad ? "⚠" : row ? "✓" : "•"} {email}
                                </span>
                                {note && <span className="block text-danger">{note}</span>}
                              </span>
                              <button
                                type="button"
                                aria-label={`${groupPanel.remove}: ${email}`}
                                onClick={() =>
                                  setMemberEmails((current) =>
                                    current.filter((value) => value !== email),
                                  )
                                }
                                className="shrink-0 text-fg-subtle transition hover:text-danger"
                              >
                                ✕
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <p className="mt-2 text-xs font-semibold text-fg-muted" role="status">
                      {previewLoading
                        ? groupPanel.checking
                        : groupSize < GROUP_MIN_SIZE
                          ? groupPanel.needMore(GROUP_MIN_SIZE - groupSize)
                          : groupPanel.size(groupSize)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-line bg-card px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                {cartModal.total}
                {groupSize > 1 ? ` · ${groupPanel.size(groupSize)}` : ""}
              </p>
              {/* Giá sau giảm là con số to nhất và giá gốc đứng ngay cạnh nó —
                  cùng cách trình bày với components/ui/price-tag.tsx. */}
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-2xl font-bold tracking-tight text-primary">
                  {formatVnd(totalVnd)}
                </span>
                {discounted && (
                  <s className="text-sm font-semibold text-fg-subtle">
                    <span className="sr-only">{groupPanel.listPrice} </span>
                    {formatVnd(listTotalVnd)}
                  </s>
                )}
              </p>
            </div>
            <form action={action}>
              {/* Chỉ gửi email và con số đang hiển thị. Server phân giải lại nhóm
                  và tính lại giá; `tongTienDuKien` chỉ dùng để phát hiện lệch. */}
              {memberEmails.map((email) => (
                <input key={email} type="hidden" name="thanhVien" value={email} />
              ))}
              <input type="hidden" name="tongTienDuKien" value={String(totalVnd)} />
              <button
                type="submit"
                disabled={
                  selected.length === 0 ||
                  loading ||
                  checkoutPending ||
                  previewLoading ||
                  blocked
                }
                onClick={() => trackCheckout(selected.length, totalVnd)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <IconCart size={16} />
                {checkoutPending
                  ? cartModal.paying
                  : groupSize > 1
                    ? `${groupPanel.checkout(groupSize)} · ${formatVnd(totalVnd)}`
                    : `${cartModal.checkout} · ${formatVnd(totalVnd)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </dialog>
  );
}
