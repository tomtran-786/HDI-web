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
import { LineItem } from "@/components/checkout/line-item";
import { SummaryCard, type SummaryLine } from "@/components/checkout/summary-card";
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

/** Lý do `/api/gio-hang/ma-gioi-thieu` từ chối một mã → câu báo cho người mua. */
const promoErrors = {
  unknown: referralPanel.codeUnknownError,
  self: referralPanel.codeSelfError,
  throttled: referralPanel.codeThrottledError,
} as const;

export function CartClient() {
  const router = useRouter();
  const { ids, full, add, remove } = useCart();
  const focusSlug = useSearchParams().get("course");

  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Đã có ít nhất một lượt nạp catalog xong (thành công hay lỗi). Trước đó giỏ
  // chưa biết mình trống hay chưa, nên hiện khung chờ chứ không hiện "trống".
  const [loaded, setLoaded] = useState(false);
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
  // Mã đã được server xác nhận qua nút "Áp dụng". Chỉ mã này mới bật khoản giảm
  // và mới đi theo form; sửa ô nhập sau khi đã áp dụng thì về trạng thái chưa áp.
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [promoStatus, setPromoStatus] = useState<
    { kind: "ok" | "error"; message: string } | null
  >(null);
  const [promoChecking, setPromoChecking] = useState(false);
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
      setLoaded(true);
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

  // `?course=` là cách "Đăng ký" ở trang khóa đưa một khóa vào giỏ: openCart
  // chỉ điều hướng, nên chính trang này thêm khóa sau khi catalog về. Mỗi slug
  // chỉ thêm MỘT lần — nếu không, người mua bấm "Xóa" xong sẽ thấy khóa tự quay
  // lại ở lần render kế tiếp.
  const autoAdded = useRef<string | null>(null);
  const [focusNotice, setFocusNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!focusSlug || catalog.length === 0 || autoAdded.current === focusSlug) return;
    autoAdded.current = focusSlug;
    const course = catalog.find((item) => item.slug === focusSlug);
    if (!course) return;
    if (course.availability === "buyable" && course.id) {
      if (!ids.includes(course.id)) {
        add(course.id);
        trackCartAdd(course.slug);
      }
    } else if (course.availability !== "pending") {
      // `pending` đã có dải "đang có đơn chờ" riêng ở đầu giỏ.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocusNotice(
        cartPage.focusUnavailable(course.title, availabilityLabel[course.availability]),
      );
    }
  }, [catalog, focusSlug, ids, add]);

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
  // Các khóa đang nằm trong cookie giỏ hàng, theo thứ tự thêm vào. Khóa không
  // còn mua được vẫn hiện (kèm badge) cho tới khi `staleIds` gỡ nó đi.
  const inCart = ids.flatMap((id) => {
    const course = byId.get(id);
    return course ? [course] : [];
  });
  const selected = inCart.filter((course) => course.availability === "buyable");
  // Gợi ý khi giỏ trống: tối đa ba khóa đang mở bán và còn chỗ.
  const suggestions = catalog
    .filter((course) => course.availability === "buyable" && course.id)
    .slice(0, 3);

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
   * `referralActive`: đã có người giới thiệu (`eligible`), HOẶC đã bấm "Áp dụng"
   * và server xác nhận một mã (`appliedCode`). Vế thứ hai bắt buộc phải tính vào
   * đây — server sẽ áp 10% ngay khi nhận mã, nên `tongTienDuKien` phải phản ánh
   * sẵn con số đó, bằng không nhánh chốt giá sẽ hủy đơn vừa tạo. Chỉ gõ mà chưa
   * "Áp dụng" thì KHÔNG tính: mã chưa được kiểm có thể sai.
   */
  const referralActive =
    referral.eligible || (referral.canEnterCode && appliedCode !== null);
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

  /**
   * Nút "Áp dụng": hỏi server xem mã có dùng được không, rồi mới bật khoản giảm.
   *
   * Kết quả chỉ để con số trên màn hình khớp với những gì server sắp tính; server
   * action `checkout` vẫn tra mã lại từ đầu. Hai ca 401/409 đi cổng đăng nhập /
   * hoàn tất hồ sơ giống `loadCatalog`.
   */
  const applyCode = async () => {
    const code = referralCodeDraft.trim().toUpperCase();
    if (!code || promoChecking) return;
    setPromoChecking(true);
    setPromoStatus(null);
    try {
      const response = await fetch("/api/gio-hang/ma-gioi-thieu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        cache: "no-store",
      });
      if (response.status === 401 || response.status === 409) {
        const gate = response.status === 401 ? "/dang-nhap" : "/hoan-tat-ho-so";
        router.push(`${gate}?tiep=${encodeURIComponent(cartReturnTo(focusSlug))}`);
        return;
      }
      const result = (await response.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; reason: keyof typeof promoErrors }
        | null;
      if (result?.ok === true) {
        setAppliedCode(code);
        setPromoStatus({ kind: "ok", message: cartPage.promo.applied });
      } else if (result && result.ok === false && result.reason in promoErrors) {
        setAppliedCode(null);
        setPromoStatus({ kind: "error", message: promoErrors[result.reason] });
      } else {
        throw new Error(`promo_${response.status}`);
      }
    } catch (error) {
      console.error("[cart] Không kiểm tra được mã giới thiệu:", error);
      setAppliedCode(null);
      setPromoStatus({ kind: "error", message: cartPage.promo.networkError });
    } finally {
      setPromoChecking(false);
    }
  };

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

  const groupDiscountVnd = Math.max(0, listTotalVnd - subtotalVnd);
  const lines: SummaryLine[] = [
    {
      key: "subtotal",
      label: cartPage.subtotal,
      value: formatVnd(listTotalVnd),
    },
    ...(groupDiscountVnd > 0
      ? [
          {
            key: "group",
            label: cartPage.groupDiscount,
            value: `−${formatVnd(groupDiscountVnd)}`,
            tone: "discount" as const,
          },
        ]
      : []),
    ...(referralDiscount > 0
      ? [
          {
            key: "referral",
            label: cartPage.referralDiscount,
            value: `−${formatVnd(referralDiscount)}`,
            tone: "discount" as const,
          },
        ]
      : referralSuperseded
        ? [
            // Không in "−0 đ": im lặng thì người mua tưởng mã hỏng, còn con số 0
            // thì nghe như mã không có giá trị. Chỉ nói vì sao không có khoản trừ.
            {
              key: "referral-superseded",
              label: cartPage.referralDiscount,
              note: referralPanel.supersededByGroup,
            },
          ]
        : []),
    ...(referral.creditBalanceVnd > 0
      ? [
          {
            key: "credits",
            // Kể tên credits riêng: đó là tiền của người mua, không phải một
            // khuyến mãi, nên họ phải thấy nó vừa bị tiêu bao nhiêu.
            label: (
              <label className="flex cursor-pointer items-start gap-2">
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
              </label>
            ),
            value: creditApplied > 0 ? `−${formatVnd(creditApplied)}` : undefined,
            tone: "discount" as const,
            note:
              useCredit && creditApplied < referral.creditBalanceVnd
                ? creditCapped
                  ? referralPanel.creditCapNote(CREDIT_MAX_SHARE_PCT)
                  : referralPanel.remainderNote
                : undefined,
          },
        ]
      : []),
  ];

  const cartReady = loaded || catalog.length > 0;
  const showEmpty = cartReady && inCart.length === 0;

  const banners = (
    <>
      {pruned && (
        <p role="status" className="mb-3 rounded-md border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
          {cartModal.pruned}
        </p>
      )}
      {droppedGroup && (
        <p role="status" className="mb-3 rounded-md border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
          {groupPanel.dropped}
        </p>
      )}
      {focusNotice && (
        <p role="status" className="mb-3 rounded-md border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
          {focusNotice}
        </p>
      )}
      {pendingOrderCodes.length > 0 && (
        <p role="status" className="mb-3 rounded-md border border-primary bg-tint px-4 py-3 text-sm text-fg">
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
        <p role="alert" className="mb-3 rounded-md border border-line bg-bg-soft px-4 py-3 text-sm text-danger">
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
    </>
  );

  const moreCourses = (
    <Link
      href="/khoa-hoc"
      className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:underline"
    >
      {cartPage.backToCourses}
      <IconArrow size={15} />
    </Link>
  );

  // Giỏ trống: một cột, không có thẻ tóm tắt — chỉ lời mời chọn khóa và vài gợi ý.
  if (showEmpty) {
    return (
      <div className="mx-auto max-w-3xl">
        {banners}
        <div className="rounded-card border border-line bg-card px-6 py-10 text-center">
          <IconCart size={28} className="mx-auto text-fg-subtle" />
          <h2 className="mt-3 text-lg font-bold text-fg">{cartPage.empty.title}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
            {cartPage.empty.body}
          </p>
          <Link
            href="/khoa-hoc"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition-colors hover:bg-primary-deep"
          >
            {cartPage.empty.browse}
            <IconArrow size={15} />
          </Link>
        </div>

        {suggestions.length > 0 && (
          <section className="mt-8" aria-labelledby="cart-suggestions">
            <h2 id="cart-suggestions" className="text-sm font-bold text-fg">
              {cartPage.empty.suggestTitle}
            </h2>
            <ul className="mt-2 divide-y divide-line">
              {suggestions.map((course) => (
                <LineItem
                  key={course.slug}
                  course={course}
                  unitVnd={course.priceVnd}
                  listVnd={course.priceVnd}
                >
                  <div className="mt-auto flex justify-end pt-3">
                    <button
                      type="button"
                      disabled={full}
                      onClick={() => {
                        if (!course.id) return;
                        add(course.id);
                        trackCartAdd(course.slug);
                      }}
                      className="rounded-md border border-primary px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-tint disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cartPage.empty.add}
                    </button>
                  </div>
                </LineItem>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ------- Cột trái: báo trạng thái + các khóa trong giỏ ------- */}
        <div className="min-w-0">
          {banners}

          {!cartReady ? (
            <div className="space-y-5" aria-label={cartModal.loading}>
              {[0, 1].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-md bg-tint" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {inCart.map((course) => {
                const buyable = course.availability === "buyable" && Boolean(course.id);
                const unit = seatPriceVnd(course, groupSize);
                // Giá một ghế khi đủ bậc nhóm — tính bằng chính hàm server dùng.
                const groupFromVnd = seatPriceVnd(course, GROUP_MIN_SIZE);
                const hasGroupDeal = course.groupEligible && groupFromVnd < course.priceVnd;
                return (
                  <LineItem
                    key={course.slug}
                    id={`cart-course-${course.slug}`}
                    course={course}
                    unitVnd={buyable ? unit : undefined}
                    listVnd={course.priceVnd}
                    learners={buyable ? groupSize : undefined}
                    dealNote={
                      !buyable
                        ? undefined
                        : unit < course.priceVnd
                          ? groupPanel.dealBadge
                          : hasGroupDeal
                            ? `${formatVnd(groupFromVnd)}/người khi mua ${groupPanel.dealBadge}`
                            : undefined
                    }
                    status={
                      buyable ? undefined : (
                        <Badge tone="warning">
                          {availabilityLabel[course.availability]}
                        </Badge>
                      )
                    }
                    onRemove={() => {
                      if (!course.id) return;
                      remove(course.id);
                      trackCartRemove(course.slug);
                    }}
                  />
                );
              })}
            </ul>
          )}

          {selected.length > 0 && anyGroupEligible && (
            <section
              aria-labelledby="cart-group-title"
              className="mt-2 rounded-md border border-line p-4"
            >
              <h2 id="cart-group-title" className="text-sm font-bold text-fg">
                {cartPage.group.title}
              </h2>
              <div className="mt-3">
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
            </section>
          )}

          {moreCourses}
        </div>

        {/* ------- Cột phải: thẻ "Tóm tắt đơn hàng" (dính trên desktop) ------- */}
        <SummaryCard
          title={cartPage.summaryTitle}
          lines={lines}
          total={{
            label: cartPage.total,
            value: formatVnd(totalVnd),
            was: discounted ? formatVnd(listTotalVnd) : undefined,
            note: groupSize > 1 ? groupPanel.size(groupSize) : undefined,
          }}
          actions={
            <form
              action={action}
              id="cart-checkout-form"
              onSubmit={() => trackCheckout(selected.length, totalVnd)}
            >
              {/* Chỉ gửi email và con số đang hiển thị. Server phân giải lại nhóm
                  và tính lại giá; `tongTienDuKien` chỉ dùng để phát hiện lệch. */}
              {memberEmails.map((email) => (
                <input key={email} type="hidden" name="thanhVien" value={email} />
              ))}
              <input type="hidden" name="tongTienDuKien" value={String(totalVnd)} />
              <input type="hidden" name="duNgCredit" value={useCredit ? "1" : "0"} />
              {/* Mã chỉ đi theo form sau khi server đã xác nhận ở nút "Áp dụng";
                  server vẫn tra lại lần nữa khi thanh toán. */}
              {referral.canEnterCode && appliedCode && (
                <input type="hidden" name="maGioiThieu" value={appliedCode} />
              )}
              <button
                type="submit"
                disabled={checkoutDisabled}
                className="hidden w-full items-center justify-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60 lg:inline-flex"
              >
                <IconCart size={16} />
                {checkoutLabel}
              </button>
              <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
                {cartModal.payosHint}
              </p>
            </form>
          }
        >
          {/* Ô mã giới thiệu chỉ hiện cho người chưa có người giới thiệu và chưa
              chốt đơn nào — server dựng cờ này trong `referralQuoteFor`. */}
          {selected.length > 0 && referral.canEnterCode && (
            <div>
              <label htmlFor="cart-promo" className="text-xs font-semibold text-fg-muted">
                {cartPage.promo.label}
              </label>
              <div className="mt-1.5 flex">
                <input
                  id="cart-promo"
                  type="text"
                  value={referralCodeDraft}
                  onChange={(event) => {
                    const next = event.target.value.toUpperCase();
                    setReferralCodeDraft(next);
                    if (appliedCode !== null && next.trim() !== appliedCode) {
                      setAppliedCode(null);
                      setPromoStatus(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    void applyCode();
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={12}
                  placeholder={referralPanel.codePlaceholder}
                  className="min-w-0 flex-1 rounded-l-md border border-r-0 border-line bg-bg px-3 py-2 text-sm uppercase tracking-wide text-fg outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-fg-subtle focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => void applyCode()}
                  disabled={promoChecking || referralCodeDraft.trim() === ""}
                  className="shrink-0 rounded-r-md bg-primary px-4 py-2 text-sm font-bold text-primary-fg transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {promoChecking ? cartPage.promo.applying : cartPage.promo.apply}
                </button>
              </div>
              <p
                role="status"
                className={`mt-1.5 min-h-4 text-xs leading-relaxed ${
                  promoStatus?.kind === "error" ? "text-danger" : "text-success"
                }`}
              >
                {promoStatus?.message}
              </p>
              {!promoStatus && (
                <p className="text-xs leading-relaxed text-fg-subtle">
                  {referralPanel.codeHint}
                </p>
              )}
            </div>
          )}
        </SummaryCard>
      </div>

      {/* ------- Thanh thanh toán dính đáy màn hình trên mobile ------- */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {cartPage.total}
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
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconCart size={16} />
            {checkoutLabel}
          </button>
        </div>
      )}
    </>
  );
}
