"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { checkout, type CheckoutState } from "@/app/actions/checkout";
import { useCart } from "@/components/cart-provider";
import type { CatalogCourse, CourseAvailability } from "@/lib/cart";
import { formatVnd } from "@/lib/format";
import { trackCartAdd, trackCartRemove, trackCheckout } from "@/lib/analytics";
import { cartModal, cartPage, groupPanel, referralPanel } from "@/content/checkout";
import { cartReturnTo } from "@/lib/cart-return";
import { GROUP_MIN_SIZE, seatPriceVnd } from "@/lib/group-pricing";
import {
  CREDIT_MAX_SHARE_PCT,
  creditToApply,
  maxCreditForTuitionVnd,
  referralDiscountVnd,
} from "@/lib/referral-pricing";
import { addMemberEmails, groupApplies, MAX_MEMBERS } from "@/lib/group-invite";
import { Badge } from "@/components/ui/badge";
import { IconArrow, IconCart } from "@/components/ui/icons";

type ReferralQuote = {
  eligible: boolean;
  canEnterCode: boolean;
  creditBalanceVnd: number;
};

type CatalogResponse = {
  email: string;
  catalog: CatalogCourse[];
  staleIds: string[];
  referral: ReferralQuote;
};

const NO_REFERRAL: ReferralQuote = {
  eligible: false,
  canEnterCode: false,
  creditBalanceVnd: 0,
};

type GroupPreview = {
  groupSize: number;
  /** Số email đã gõ mà báo giá này trả lời, kể cả email chưa có tài khoản. */
  requestedSize: number;
  /** Các course id (đã sắp xếp) mà `totalVnd` được tính trên đó. */
  cartKey: string;
  discountApplies: boolean;
  members: { email: string; registered: boolean; conflict: boolean }[];
  totalVnd: number;
  blocked: boolean;
};

const availabilityLabel: Record<CourseAvailability, string> = {
  ...cartModal.availability,
};

export function CartClient() {
  const router = useRouter();
  const { ids, full, add, remove } = useCart();
  const focusSlug = useSearchParams().get("course");

  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pruned, setPruned] = useState(false);
  const [state, action, checkoutPending] = useActionState<CheckoutState, FormData>(
    checkout,
    {},
  );
  const [groupOpen, setGroupOpen] = useState(false);
  // Email của chính người đang đăng nhập, về cùng catalog. Ô mời nhóm phải bỏ
  // qua nó đúng như server làm; xem lib/group-invite.ts.
  const [leaderEmail, setLeaderEmail] = useState("");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [droppedGroup, setDroppedGroup] = useState(false);
  // Giá trị `anyGroupEligible` của lượt render trước, để phát hiện đúng khoảnh
  // khắc giỏ thôi hưởng ưu đãi nhóm. Xem khối chỉnh state bên dưới.
  const [groupWasEligible, setGroupWasEligible] = useState(false);
  const [draft, setDraft] = useState("");
  const [referral, setReferral] = useState<ReferralQuote>(NO_REFERRAL);
  // Mã giới thiệu gõ ở giỏ hàng. KHÔNG reset khi `refreshCatalog` — một lỗi
  // không liên quan không được bắt người mua gõ lại mã.
  const [referralCodeDraft, setReferralCodeDraft] = useState("");
  // Ý muốn tiêu credits. Chỉ MỘT bit này đi lên server; số tiền được trừ do
  // `createOrder` tự tính lại bên trong transaction đã khóa hàng user.
  const [useCredit, setUseCredit] = useState(false);
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // Báo giá nhóm hỏng (mạng chớp, hoặc chạm rate limit 60 lượt/giờ của
  // /api/gio-hang/nhom). Phải nói ra: nút Thanh toán bị khóa khi nhóm chưa được
  // xác nhận, và một nút xám không lời giải thích là một ngõ cụt.
  const [previewError, setPreviewError] = useState(false);
  // Mỗi lượt gọi mang một số thứ tự. Người dùng gõ nhanh hơn mạng trả lời, nên
  // không có nó thì một phản hồi cũ về muộn sẽ ghi đè lên báo giá mới nhất.
  const previewSeq = useRef(0);

  const addMember = useCallback(
    (raw: string) => {
      setMemberEmails((current) => addMemberEmails(current, raw, leaderEmail));
      setDraft("");
    },
    [leaderEmail],
  );

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setPruned(false);
    setDroppedGroup(false);
    try {
      const response = await fetch("/api/gio-hang", { cache: "no-store" });
      if (response.status === 401 || response.status === 409) {
        const destination = cartReturnTo(focusSlug);
        const gate = response.status === 401 ? "/dang-nhap" : "/hoan-tat-ho-so";
        router.push(`${gate}?tiep=${encodeURIComponent(destination)}`);
        return;
      }
      if (!response.ok) throw new Error(`catalog_${response.status}`);
      const data = (await response.json()) as CatalogResponse;
      setLeaderEmail(data.email ?? "");
      setCatalog(data.catalog);
      setReferral(data.referral ?? NO_REFERRAL);
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
  }, [focusSlug, remove, router]);

  useEffect(() => {
    // Nạp catalog một lần khi trang mở. `loadCatalog` bật cờ `loading` ngay từ
    // đầu (trước `await` đầu tiên) — đúng kiểu "gọi API lúc mount" mà quy tắc
    // set-state-in-effect không nhận ra là bất đồng bộ.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!state.refreshCatalog) return;
    const frame = window.requestAnimationFrame(() => void loadCatalog());
    return () => window.cancelAnimationFrame(frame);
  }, [state, loadCatalog]);

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
  /**
   * Báo giá đang cầm có còn trả lời đúng câu hỏi trên màn hình không.
   *
   * Hai vế, và cả hai đều cần thiết:
   *
   * `requestedSize` chứ KHÔNG phải `groupSize`. Server trả `groupSize` là số
   * người phân giải được, còn client đếm số email đã gõ — hễ có một thành viên
   * chưa có tài khoản thì hai con số lệch nhau vĩnh viễn, và mọi thứ gác sau
   * phép so này (đáng kể nhất là `blocked`) tắt ngóm đúng lúc cần bật.
   *
   * `cartKey` vì effect báo giá debounce 350 ms và chỉ bật `previewLoading` bên
   * trong callback. Trong quãng đó, tick thêm một khóa không đổi số người —
   * preview cũ vẫn "khớp nhóm" trong khi `totalVnd` của nó là tổng của giỏ
   * trước. `tongTienDuKien` đi lên server với con số đó là một đơn bị tạo rồi
   * hủy ngay ở nhánh chốt giá của app/actions/checkout.ts.
   */
  const cartKey = [...ids].sort().join(",");
  const previewFresh = Boolean(
    preview && preview.requestedSize === groupSize && preview.cartKey === cartKey,
  );
  // Ưu tiên con số server vừa trả, nhưng chỉ khi nó còn ứng với đúng nhóm và
  // đúng giỏ hàng hiện tại.
  const subtotalVnd = previewFresh ? preview!.totalVnd : localTotalVnd;

  /**
   * Hai khoản trừ cuối cùng, tính bằng CHÍNH các hàm mà `createOrder` gọi.
   *
   * Đây là chỗ dễ vỡ nhất của tính năng: `app/actions/checkout.ts` so
   * `tongTienDuKien` với `amountVnd` bằng phép so bằng tuyệt đối rồi HỦY đơn
   * nếu lệch. Viết lại phép tính ở đây — dù chỉ đổi thứ tự trừ — là làm mọi đơn
   * của người được giới thiệu không thanh toán được.
   *
   * `referralActive`: đã có người giới thiệu (`eligible`), HOẶC đang gõ một mã ở
   * ô nhập tại giỏ hàng. Vế thứ hai bắt buộc phải tính vào đây — server sẽ áp
   * 10% ngay khi nhận mã, nên `tongTienDuKien` phải phản ánh sẵn con số đó,
   * bằng không nhánh chốt giá sẽ hủy đơn vừa tạo.
   */
  const referralActive =
    referral.eligible ||
    (referral.canEnterCode && referralCodeDraft.trim().length > 0);
  const referralDiscount = referralDiscountVnd({
    listSubtotalVnd: listTotalVnd,
    subtotalVnd,
    eligible: referralActive,
  });
  const creditApplied = creditToApply({
    balanceVnd: referral.creditBalanceVnd,
    dueVnd: subtotalVnd - referralDiscount,
    tuitionVnd: subtotalVnd,
    wanted: useCredit,
  });
  /**
   * Ưu đãi nhóm đã nuốt mất khoản giảm giới thiệu. Nói ra, vì im lặng hiện 0đ
   * thì người mua tưởng mã của mình hỏng chứ không hiểu là hai ưu đãi không
   * cộng dồn và họ đang hưởng mức cao hơn.
   */
  const referralSuperseded =
    referralActive && referralDiscount === 0 && listTotalVnd > subtotalVnd;
  /** Số dư còn nhưng bị trần 30% học phí chặn lại. */
  const creditCapped =
    useCredit &&
    creditApplied > 0 &&
    creditApplied < referral.creditBalanceVnd &&
    creditApplied === maxCreditForTuitionVnd(subtotalVnd);
  const totalVnd = subtotalVnd - referralDiscount - creditApplied;
  const discounted = listTotalVnd > totalVnd;
  const anyGroupEligible = selected.some((course) => course.groupEligible);
  const blocked = previewFresh && preview!.blocked;
  /**
   * Đơn đang chờ của chính người này, gom từ các dòng bị khóa.
   *
   * Đây là lối ra khỏi ngõ cụt: khóa có `availability === "pending"` bị `disabled`
   * nên không bao giờ vào được `selected`, nút Thanh toán vì thế luôn tắt, và
   * lời từ chối `already_enrolled` — chỗ duy nhất từng in ra mã đơn — không bao
   * giờ chạy. Người mua bỏ dở một lần thanh toán thấy khóa của mình xám đi mà
   * không có đường nào tới đơn còn sống của họ, suốt cả `ORDER_TTL_HOURS`.
   */
  const pendingOrderCodes = useMemo(
    () => [
      ...new Set(
        catalog.flatMap((course) =>
          course.availability === "pending" && course.pendingOrderCode !== null
            ? [course.pendingOrderCode]
            : [],
        ),
      ),
    ],
    [catalog],
  );

  /**
   * Bỏ nhóm ngay khi giỏ không còn khóa nào hưởng ưu đãi.
   *
   * Bảng nhập thành viên nằm sau `anyGroupEligible`, nhưng các input ẩn ở thanh
   * tóm tắt thì LUÔN được render từ `memberEmails`. Không dọn, một nhóm còn treo
   * trong state sau khi khóa có ưu đãi rời giỏ vẫn đi theo form — người mua
   * không còn thấy danh sách, không còn nút gỡ, và đơn ra là N ghế giá lẻ với
   * tổng tiền server tính khớp y hệt nên không chốt chặn nào bắt được.
   *
   * Chỉnh state ngay trong thân render, KHÔNG bằng useEffect. Effect chạy sau
   * khi đã commit, nên sẽ có đúng một lượt render mà các input ẩn còn mang nhóm
   * cũ — và đó chính là lượt render form có thể bị submit. React dựng lại ngay
   * component khi gặp setState ở đây, trước khi có bất cứ thứ gì ra tới DOM.
   */
  if (groupWasEligible !== anyGroupEligible) {
    setGroupWasEligible(anyGroupEligible);
    if (!groupApplies(memberEmails.length, anyGroupEligible)) {
      setMemberEmails([]);
      setGroupOpen(false);
      setPreview(null);
      setPreviewError(false);
      setDraft("");
      setDroppedGroup(true);
    }
  }

  useEffect(() => {
    const seq = ++previewSeq.current;
    const emails = memberEmails;
    // Mọi setState nằm trong callback của timeout, không nằm thẳng trong thân
    // effect: gọi đồng bộ ở đây là một vòng render thừa cho mỗi phím gõ.
    const timer = window.setTimeout(async () => {
      if (seq !== previewSeq.current) return;
      if (emails.length === 0) {
        setPreview(null);
        setPreviewError(false);
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
          setPreviewError(true);
          return;
        }
        setPreview((await response.json()) as GroupPreview);
        setPreviewError(false);
      } catch (error) {
        if (seq !== previewSeq.current) return;
        console.error("[cart] Không báo giá được cho nhóm:", error);
        setPreview(null);
        setPreviewError(true);
      } finally {
        if (seq === previewSeq.current) setPreviewLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [memberEmails, ids]);

  const checkoutDisabled =
    selected.length === 0 ||
    loading ||
    checkoutPending ||
    previewLoading ||
    // Có nhóm mà báo giá chưa ứng với nhóm/giỏ hiện tại thì chưa được đi tiếp.
    // Bao trọn cả quãng debounce 350 ms lẫn trường hợp báo giá hỏng — hai chỗ
    // mà trước đây `blocked` là `false` chỉ vì không có gì để so.
    (memberEmails.length > 0 && !previewFresh) ||
    blocked;
  const checkoutLabel = checkoutPending
    ? cartModal.paying
    : groupSize > 1
      ? groupPanel.checkout(groupSize)
      : cartModal.checkout;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ------- Cột trái: báo trạng thái + danh sách khóa ------- */}
        <div className="min-w-0">
          {pruned && (
            <p role="status" className="mb-3 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
              {cartModal.pruned}
            </p>
          )}
          {droppedGroup && (
            <p role="status" className="mb-3 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
              {groupPanel.dropped}
            </p>
          )}
          {pendingOrderCodes.length > 0 && (
            <p role="status" className="mb-3 rounded-card border border-primary bg-tint px-4 py-3 text-sm text-fg">
              {cartModal.pendingHold}{" "}
              {pendingOrderCodes.map((code) => (
                <a
                  key={code}
                  href={`/tai-khoan/don-hang/${code}`}
                  className="font-bold text-primary underline underline-offset-4"
                >
                  {cartModal.openPendingOrder(code)}
                </a>
              ))}
            </p>
          )}
          {(loadError || state.error) && (
            <p role="alert" className="mb-3 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-danger">
              {state.error ?? loadError}
              {state.pendingOrderCode !== undefined && (
                <>
                  {" "}
                  <a
                    href={`/tai-khoan/don-hang/${state.pendingOrderCode}`}
                    className="font-bold underline underline-offset-4"
                  >
                    {cartModal.openPendingOrder(state.pendingOrderCode)}
                  </a>
                </>
              )}
            </p>
          )}

          {loading && catalog.length === 0 ? (
            <div className="space-y-2" aria-label={cartModal.loading}>
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-card bg-tint" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {catalog.map((course) => {
                const buyable = course.availability === "buyable" && Boolean(course.id);
                const checked = Boolean(course.id && ids.includes(course.id));
                // Giá một ghế khi đủ bậc nhóm — tính bằng chính hàm server dùng.
                const groupFromVnd = seatPriceVnd(course, GROUP_MIN_SIZE);
                const hasGroupDeal = course.groupEligible && groupFromVnd < course.priceVnd;
                const offPct = hasGroupDeal
                  ? Math.round((1 - groupFromVnd / course.priceVnd) * 100)
                  : 0;
                return (
                  <li
                    id={`cart-course-${course.slug}`}
                    key={course.slug}
                    className={`flex gap-3 rounded-card border p-3 transition sm:p-4 ${
                      checked ? "border-primary bg-tint" : "border-line bg-card"
                    } ${buyable ? "" : "opacity-70"}`}
                  >
                    <span
                      aria-hidden
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-card bg-tint text-xs font-bold tracking-tight text-primary sm:text-sm"
                    >
                      {course.code}
                    </span>
                    <label
                      className={`flex min-w-0 flex-1 gap-3 ${
                        buyable ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                    >
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
                        <span className="mt-2 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
                          <span className={`text-sm font-semibold ${buyable ? "text-success" : "text-fg-subtle"}`}>
                            {availabilityLabel[course.availability]}
                            {buyable && course.seatsLeft !== null ? ` · còn ${course.seatsLeft} chỗ` : ""}
                            {course.availability === "pending" && course.pendingOrderCode !== null && (
                              <>
                                {" · "}
                                <a
                                  href={`/tai-khoan/don-hang/${course.pendingOrderCode}`}
                                  onClick={(event) => event.stopPropagation()}
                                  className="font-bold text-primary underline underline-offset-4"
                                >
                                  {cartModal.openPendingOrderShort(course.pendingOrderCode)}
                                </a>
                              </>
                            )}
                          </span>
                          {/* Giá sau ưu đãi to & đậm, giá gốc gạch ngang ngay
                              cạnh, badge % — cùng cách trình bày với
                              components/ui/price-tag.tsx. */}
                          <span className="flex flex-col items-end gap-1 text-right">
                            {hasGroupDeal && <Badge tone="success">−{offPct}%</Badge>}
                            {groupFromVnd < course.priceVnd && (
                              <s className="text-xs font-semibold text-fg-subtle">
                                <span className="sr-only">{groupPanel.listPrice} </span>
                                {formatVnd(course.priceVnd)}
                              </s>
                            )}
                            <span className="text-lg font-bold text-primary">
                              {formatVnd(hasGroupDeal ? groupFromVnd : course.priceVnd)}
                            </span>
                          </span>
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/khoa-hoc"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:underline"
          >
            {cartPage.backToCourses}
            <IconArrow size={15} />
          </Link>
        </div>

        {/* ------- Cột phải: thanh tóm tắt đơn (dính trên desktop) ------- */}
        <aside className="self-start rounded-card border border-line bg-card p-4 lg:sticky lg:top-24">
          <p className="text-sm font-bold text-fg">
            {cartModal.selected} · {selected.length} khóa
          </p>
          {selected.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              {cartModal.empty}
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {selected.map((course) => {
                const unit = seatPriceVnd(course, groupSize);
                return (
                  <li key={course.id} className="flex items-start justify-between gap-3">
                    <span className="min-w-0 leading-snug text-fg-muted">
                      <span className="font-bold text-fg">{course.title}</span>
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
            <div className="mt-4 border-t border-line pt-3">
              {/* Checkbox bật ưu đãi nhóm — mental model quen cho "chọn thêm một
                  lựa chọn". Bỏ tick chính là huỷ nhóm. */}
              <label className="flex cursor-pointer gap-2.5 rounded-card border border-primary/40 bg-tint p-2.5">
                <input
                  type="checkbox"
                  checked={groupOpen}
                  onChange={(event) => {
                    setDroppedGroup(false);
                    if (event.target.checked) {
                      setGroupOpen(true);
                    } else {
                      setGroupOpen(false);
                      setMemberEmails([]);
                      setDraft("");
                      setPreview(null);
                      setPreviewError(false);
                    }
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                />
                <span className="text-sm font-semibold text-primary">
                  {groupPanel.invite}
                </span>
              </label>

              {groupOpen && (
                <div className="mt-3">
                  <p className="text-xs leading-relaxed text-fg-muted">
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
                        disabled={memberEmails.length >= MAX_MEMBERS}
                        className="min-w-0 flex-1 rounded-full border border-line bg-bg px-3 py-2 text-sm text-fg outline-none transition focus:border-primary disabled:opacity-60"
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
                              bad ? "border-danger/40 bg-danger/5" : "border-line bg-bg"
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
                  {previewError && !previewLoading && (
                    <p
                      role="alert"
                      className="mt-2 rounded-card border border-danger/40 bg-danger/5 px-2.5 py-2 text-xs leading-relaxed text-danger"
                    >
                      {groupPanel.checkFailed}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------- Chi tiết đơn: Tổng giá / Tổng giảm / Tổng ------- */}
          <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-fg-muted">{cartPage.listTotal}</dt>
              <dd className="tabular-nums text-fg">{formatVnd(listTotalVnd)}</dd>
            </div>
            {discounted && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-fg-muted">{cartPage.discountTotal}</dt>
                <dd className="tabular-nums font-semibold text-success">
                  −{formatVnd(listTotalVnd - totalVnd)}
                </dd>
              </div>
            )}
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-2">
              <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                {cartModal.total}
                {groupSize > 1 ? ` · ${groupPanel.size(groupSize)}` : ""}
              </dt>
              <dd className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xl font-bold tracking-tight text-primary">
                  {formatVnd(totalVnd)}
                </span>
                {discounted && (
                  <s className="text-xs font-semibold text-fg-subtle">
                    <span className="sr-only">{groupPanel.listPrice} </span>
                    {formatVnd(listTotalVnd)}
                  </s>
                )}
              </dd>
            </div>
          </dl>

          {/* Kể tên từng khoản trừ. Gộp tất cả vào một con số "đã giảm" thì
              người mua không thấy credits của chính mình vừa bị tiêu bao nhiêu —
              đó là tiền của họ, không phải một khuyến mãi. */}
          {selected.length > 0 &&
            (referralActive || referral.creditBalanceVnd > 0) && (
              <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm text-fg-muted">
                {referralDiscount > 0 && (
                  <p className="flex items-baseline justify-between gap-4">
                    <span>{referralPanel.discountLine}</span>
                    <span className="font-semibold text-primary">
                      −{formatVnd(referralDiscount)}
                    </span>
                  </p>
                )}
                {referralSuperseded && (
                  <p className="text-xs leading-relaxed text-fg-subtle">
                    {referralPanel.supersededByGroup}
                  </p>
                )}
                {referral.creditBalanceVnd > 0 && (
                  <>
                    <label className="flex cursor-pointer items-start justify-between gap-4">
                      <span className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={useCredit}
                          onChange={(event) => setUseCredit(event.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span>
                          {referralPanel.useCredit}{" "}
                          <span className="text-fg-subtle">
                            ({referralPanel.balance(formatVnd(referral.creditBalanceVnd))})
                          </span>
                        </span>
                      </span>
                      {creditApplied > 0 && (
                        <span className="font-semibold text-primary">
                          −{formatVnd(creditApplied)}
                        </span>
                      )}
                    </label>
                    {useCredit && creditApplied < referral.creditBalanceVnd && (
                      <p className="text-xs leading-relaxed text-fg-subtle">
                        {creditCapped
                          ? referralPanel.creditCapNote(CREDIT_MAX_SHARE_PCT)
                          : referralPanel.remainderNote}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

          <form
            action={action}
            id="cart-checkout-form"
            className="mt-4"
            onSubmit={() => trackCheckout(selected.length, totalVnd)}
          >
            {/* Chỉ gửi email và con số đang hiển thị. Server phân giải lại nhóm
                và tính lại giá; `tongTienDuKien` chỉ dùng để phát hiện lệch. */}
            {memberEmails.map((email) => (
              <input key={email} type="hidden" name="thanhVien" value={email} />
            ))}
            <input type="hidden" name="tongTienDuKien" value={String(totalVnd)} />
            <input type="hidden" name="duNgCredit" value={useCredit ? "1" : "0"} />
            {/* Ô mã giới thiệu chỉ hiện cho người chưa có người giới thiệu và
                chưa chốt đơn nào — server dựng cờ này trong `referralQuoteFor`. */}
            {selected.length > 0 && referral.canEnterCode && (
              <label className="mb-3 block">
                <span className="text-xs font-semibold text-fg-muted">
                  {referralPanel.codeLabel}
                </span>
                <input
                  type="text"
                  name="maGioiThieu"
                  value={referralCodeDraft}
                  onChange={(event) =>
                    setReferralCodeDraft(event.target.value.toUpperCase())
                  }
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={12}
                  placeholder={referralPanel.codePlaceholder}
                  className="mt-1 w-full rounded-full border border-line bg-bg px-3 py-2 text-sm uppercase tracking-wide text-fg outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-fg-subtle focus:border-primary"
                />
                <span className="mt-1 block text-xs leading-relaxed text-fg-subtle">
                  {referralPanel.codeHint}
                </span>
              </label>
            )}
            <button
              type="submit"
              disabled={checkoutDisabled}
              className="hidden w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60 lg:inline-flex"
            >
              <IconCart size={16} />
              {checkoutLabel}
            </button>
            <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
              {cartModal.payosHint}
            </p>
          </form>
        </aside>
      </div>

      {/* ------- Thanh thanh toán dính đáy màn hình trên mobile ------- */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {cartModal.total}
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-lg font-bold tracking-tight text-primary">
                {formatVnd(totalVnd)}
              </span>
              {discounted && (
                <s className="text-xs font-semibold text-fg-subtle">
                  <span className="sr-only">{groupPanel.listPrice} </span>
                  {formatVnd(listTotalVnd)}
                </s>
              )}
            </p>
          </div>
          <button
            type="submit"
            form="cart-checkout-form"
            disabled={checkoutDisabled}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconCart size={16} />
            {checkoutLabel}
          </button>
        </div>
      )}
    </>
  );
}
