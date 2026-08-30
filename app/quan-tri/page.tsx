import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { findCourse } from "@/lib/courses";
import { endOfDayVN, formatDate, formatDateTime, startOfDayVN } from "@/lib/format";
import { seatsTaken } from "@/lib/course-sales";
import { hasLiveAccess, liveAccessWhere } from "@/lib/enrollment";
import {
  enrollmentStatusLabel,
  orderStatusLabel,
  orderStatusTone,
} from "@/content/checkout";
import { serviceKindLabel } from "@/content/ai-check";
import {
  feedbackKindLabel,
  feedbackStatusLabel,
  feedbackStatusTone,
} from "@/content/feedback";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { renderMarkdown } from "@/lib/markdown-lite";
import {
  cancelPendingOrder,
  dismissFeedback,
  markFeedbackResolved,
  markPaymentReconciled,
  moderateReview,
  retryDriveAccessForEnrollment,
  updateCourseStatus,
} from "./actions";
import { AdminActionButton } from "./action-button";
import { DateFilter } from "./date-filter";

export const metadata: Metadata = {
  title: "Quản trị — HDI Research Center",
  robots: { index: false, follow: false },
};

const vnd = new Intl.NumberFormat("vi-VN");

const reviewStatusLabel: Record<string, string> = {
  pending: "Chờ duyệt",
  published: "Đang hiện",
  rejected: "Không đăng",
};

const reviewTone: Record<string, "cool" | "success" | "warning" | "danger"> = {
  pending: "warning",
  published: "success",
  rejected: "danger",
};

export default async function AdminPage({
  searchParams,
}: PageProps<"/quan-tri">) {
  const now = new Date();

  // Khoảng ngày dùng chung cho mọi danh sách bên dưới. `startOfDayVN` trả null
  // cho chuỗi rỗng/sai hình dạng/ngày không tồn tại, và null ở đây nghĩa là
  // "không chặn đầu này" — nên một URL bị gõ sai cho ra trang đầy đủ, không phải
  // trang trống hay trang lỗi.
  const query = await searchParams;
  const from = startOfDayVN(query.tu);
  const to = endOfDayVN(query.den);

  /**
   * `where` cho một cột thời gian bất kỳ. Trả về object rỗng khi không lọc, để
   * trải vào `where` mà không đổi truy vấn gốc.
   */
  const inRange = (column: string) =>
    from || to
      ? {
          [column]: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};

  const coursesPromise = prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      code: true,
      slug: true,
      capacity: true,
      priceVnd: true,
      accessDays: true,
      status: true,
      meetingUrl: true,
      communityUrl: true,
      driveFolderId: true,
    },
  });
  const [
    orders,
    enrollments,
    courses,
    reviewPayments,
    reviews,
    feedbacks,
    serviceOrders,
    missingDriveCount,
    occupiedSeats,
  ] =
    await Promise.all([
    // The reconciliation queue: money expected but not yet confirmed. There is
    // no "mark paid" button beside it, deliberately — confirmation belongs to
    // the payment webhook and nowhere else, so a row leaving this list is
    // evidence that the automated path worked.
    prisma.order.findMany({
      where: { status: { in: ["pending", "paid"] }, ...inRange("createdAt") },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        code: true,
        status: true,
        amountVnd: true,
        createdAt: true,
        expiresAt: true,
        provider: true,
        groupSize: true,
        user: { select: { name: true, email: true, phone: true } },
        items: {
          select: {
            id: true,
            course: { select: { code: true, slug: true } },
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      where: inRange("createdAt"),
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        status: true,
        createdAt: true,
        accessExpiresAt: true,
        accessRevokedAt: true,
        drivePermissionId: true,
        user: { select: { name: true, email: true } },
        course: {
          select: {
            code: true,
            slug: true,
            priceVnd: true,
            driveFolderId: true,
          },
        },
      },
    }),
    coursesPromise,
    prisma.payment.findMany({
      where: {
        // Đã có người đọc qua thì rời hàng chờ — xem markPaymentReconciled.
        reconciledAt: null,
        OR: [
          { status: "requires_review" },
          { status: "succeeded", order: { status: { not: "paid" } } },
          { status: "succeeded", serviceOrder: { status: { not: "paid" } } },
        ],
        ...inRange("receivedAt"),
      },
      orderBy: { receivedAt: "desc" },
      take: 25,
      select: {
        id: true,
        amountVnd: true,
        providerRef: true,
        receivedAt: true,
        // Đúng một trong hai có giá trị — CHECK num_nonnulls(...) = 1 trong
        // migration giữ điều đó, nên phần render bên dưới chỉ cần hỏi cái nào.
        order: {
          select: {
            code: true,
            status: true,
            amountVnd: true,
            user: { select: { email: true } },
          },
        },
        serviceOrder: {
          select: { code: true, status: true, amountVnd: true, kind: true },
        },
      },
    }),
    // Hàng chờ duyệt đánh giá. `pending` lên trước vì đó là thứ cần thao tác;
    // phần còn lại chỉ để đối chiếu những gì đang hiện trên trang khóa học.
    prisma.courseReview.findMany({
      where: inRange("createdAt"),
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 30,
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        course: { select: { slug: true } },
      },
    }),
    prisma.feedback.findMany({
      where: inRange("createdAt"),
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        status: true,
        pageUrl: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.serviceOrder.findMany({
      where: inRange("createdAt"),
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        code: true,
        kind: true,
        wordCount: true,
        amountVnd: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    }),
    prisma.enrollment.count({
      where: {
        ...liveAccessWhere(now),
        drivePermissionId: null,
        course: { driveFolderId: { not: null } },
      },
    }),
    coursesPromise.then((rows) => seatsTaken(rows.map((course) => course.id))),
  ]);

  const awaitingPayment = orders.filter((o) => o.status === "pending");
  const awaitingReview = reviews.filter((r) => r.status === "pending");
  const awaitingFeedback = feedbacks.filter((feedback) => feedback.status === "open");
  const missingDriveIds = new Set(
    enrollments
      .filter((e) => hasLiveAccess(e, now))
      .filter((e) => e.course.driveFolderId && !e.drivePermissionId)
      .map((e) => e.id),
  );

  const filtering = Boolean(from || to);

  return (
    <Section soft>
      <SectionHeading
        eyebrow="Quản trị"
        title="Ghi danh & khóa học"
        // `missingDriveCount` là count() TOÀN HỆ THỐNG và cố tình không theo bộ
        // lọc — nó là tình trạng "ngay lúc này", lọc theo ngày sẽ làm nó vô
        // nghĩa. Ba con số còn lại đếm trong phạm vi đang lọc, nên câu chữ phải
        // nói ra, kẻo hai loại số trông như cùng một loại.
        subtitle={`${awaitingPayment.length} đơn chờ thanh toán · ${reviewPayments.length} giao dịch cần đối soát · ${awaitingReview.length} đánh giá chờ duyệt · ${awaitingFeedback.length} góp ý chờ xử lý${
          filtering ? " (trong khoảng đang lọc)" : ""
        } · ${missingDriveCount} quyền Drive đang thiếu trên toàn hệ thống.`}
      />

      <DateFilter
        from={typeof query.tu === "string" ? query.tu : ""}
        to={typeof query.den === "string" ? query.den : ""}
        now={now}
      />

      {reviewPayments.length > 0 && (
        <div className="mb-10 rounded-card border border-primary bg-tint p-5 sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
            Thanh toán cần kiểm tra thủ công
          </h3>
          <ul className="mt-4 space-y-3">
            {reviewPayments.map((payment) => {
              // Một payment thuộc về đơn khóa học HOẶC đơn dịch vụ, không bao
              // giờ cả hai (CHECK payments_exactly_one_owner). Đọc theo thứ tự
              // đó và vẫn có nhánh cuối: một hàng không chủ là dấu hiệu ràng
              // buộc đã bị gỡ, và nó phải hiện ra chứ không được làm trắng trang.
              const owner = payment.order
                ? {
                    label: `Đơn #${payment.order.code}`,
                    expected: payment.order.amountVnd,
                    who: payment.order.user.email,
                  }
                : payment.serviceOrder
                  ? {
                      label: `Dịch vụ #${payment.serviceOrder.code}`,
                      expected: payment.serviceOrder.amountVnd,
                      who: serviceKindLabel(payment.serviceOrder.kind),
                    }
                  : null;
              return (
                <li
                  key={payment.id}
                  className="flex flex-col gap-2 border-b border-line/50 pb-3 text-sm text-fg-muted last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <span className="min-w-0">
                    {owner
                      ? `${owner.label} · nhận ${vnd.format(payment.amountVnd)}đ / chờ ${vnd.format(owner.expected)}đ · ${owner.who}`
                      : `Giao dịch không gắn với đơn nào · nhận ${vnd.format(payment.amountVnd)}đ`}
                    {" · "}
                    {formatDateTime(payment.receivedAt)}
                    {" · ref "}
                    {payment.providerRef}
                  </span>
                  {/* KHÔNG phải nút "đã thanh toán". Nó chỉ ghi lại rằng có
                      người đã đọc qua giao dịch, để hàng chờ đừng lặp lại mãi
                      cùng một dòng — trạng thái đơn và ghi danh không đổi. */}
                  <AdminActionButton
                    action={markPaymentReconciled}
                    id={payment.id}
                    label="Đã đối soát"
                    confirm="Đánh dấu giao dịch này là đã đối soát? Thao tác này KHÔNG xác nhận thanh toán — đơn và ghi danh giữ nguyên trạng thái."
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Đơn hàng
      </h3>
      {orders.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-6 text-sm text-fg-muted">
          Chưa có đơn hàng nào.
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-4 rounded-card border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold tabular-nums tracking-tight">
                    #{order.code}
                  </p>
                  <Badge tone={orderStatusTone[order.status] ?? "cool"}>
                    {orderStatusLabel[order.status] ?? order.status}
                  </Badge>
                  {order.groupSize > 1 && (
                    <Badge tone="cool">Nhóm {order.groupSize} người</Badge>
                  )}
                  {order.provider && (
                    <span className="text-[11px] text-fg-subtle">
                      {order.provider}
                    </span>
                  )}
                </div>
                <p className="mt-1 break-all text-sm text-fg-muted">
                  {order.user.name ?? "—"} · {order.user.email}
                  {order.user.phone ? ` · ${order.user.phone}` : ""}
                </p>
                <p className="mt-1.5 text-[13px] text-fg-subtle">
                  {order.items
                    .map(
                      (item) =>
                        `${item.course.code} · ${findCourse(item.course.slug)?.title ?? item.course.slug}`,
                    )
                    .join(" — ")}
                </p>
                {order.status === "pending" && (
                  <p className="mt-1 text-[13px] text-fg-subtle">
                    Giữ chỗ đến {formatDateTime(order.expiresAt)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <p className="text-lg font-bold tracking-tight text-primary">
                  {vnd.format(order.amountVnd)}đ
                </p>
                {order.status === "pending" && (
                  <AdminActionButton
                    action={cancelPendingOrder}
                    id={order.id}
                    label="Hủy đơn"
                    confirm={`Hủy đơn #${order.code}? Ghi danh đang giữ chỗ sẽ được thả ra.`}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-12 mb-4 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Góp ý &amp; báo lỗi
      </h3>
      {feedbacks.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-6 text-sm text-fg-muted">
          Chưa có góp ý hoặc báo lỗi nào.
        </p>
      ) : (
        <ul className="space-y-3">
          {feedbacks.map((feedback) => (
            <li
              key={feedback.id}
              className="rounded-card border border-line bg-card p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={feedback.kind === "bug" ? "danger" : "cool"}>
                      {feedbackKindLabel[feedback.kind]}
                    </Badge>
                    <Badge tone={feedbackStatusTone[feedback.status] ?? "cool"}>
                      {feedbackStatusLabel[feedback.status] ?? feedback.status}
                    </Badge>
                  </div>
                  <h4 className="mt-3 text-base font-bold tracking-tight text-fg">
                    {feedback.title}
                  </h4>
                  <p className="mt-1 break-all text-sm text-fg-muted">
                    {feedback.user.name ?? "—"} · {feedback.user.email} ·{" "}
                    {formatDateTime(feedback.createdAt)}
                  </p>
                  {feedback.pageUrl && (
                    <p className="mt-1 text-xs text-fg-subtle">
                      Trang gửi: <code>{feedback.pageUrl}</code>
                    </p>
                  )}
                  <div className="mt-4 rounded-card border border-line bg-bg-soft p-4">
                    {renderMarkdown(feedback.body)}
                  </div>
                </div>

                {feedback.status === "open" && (
                  <div className="flex shrink-0 flex-wrap items-start gap-2 sm:max-w-64 sm:justify-end">
                    <AdminActionButton
                      action={markFeedbackResolved}
                      id={feedback.id}
                      label="Đánh dấu đã xử lý"
                    />
                    <AdminActionButton
                      action={dismissFeedback}
                      id={feedback.id}
                      label="Bỏ qua"
                      confirm={`Bỏ qua góp ý “${feedback.title}”? Người gửi sẽ không nhận email đã xử lý.`}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-12 mb-4 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Ghi danh
      </h3>
      {enrollments.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-6 text-sm text-fg-muted">
          Chưa có ghi danh nào.
        </p>
      ) : (
        <ul className="space-y-3">
          {enrollments.map((e) => {
            const course = findCourse(e.course.slug);
            return (
              <li
                key={e.id}
                className="flex flex-col gap-4 rounded-card border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold tracking-tight">
                      {e.user.name ?? "—"}
                    </p>
                    <Badge tone={e.status === "paid" ? "success" : "cool"}>
                      {enrollmentStatusLabel[e.status] ?? e.status}
                    </Badge>
                    {missingDriveIds.has(e.id) && (
                      <Badge tone="cool">Thiếu quyền Drive</Badge>
                    )}
                  </div>
                  {/* break-all: a long address must wrap instead of pushing the
                      row wide and giving the page a horizontal scrollbar. */}
                  <p className="mt-1 break-all text-sm text-fg-muted">
                    {e.user.email}
                  </p>
                  <p className="mt-1.5 text-[13px] text-fg-subtle">
                    {e.course.code} · {course?.title ?? e.course.slug} ·{" "}
                    {vnd.format(e.course.priceVnd)}đ · ghi danh{" "}
                    {formatDate(e.createdAt)}
                  </p>
                </div>
                {/* Cột hành động. `sm:justify-between` ở <li> vốn đã chừa sẵn
                    chỗ này — dòng trống nằm đây trước đó là dấu vết của nó —
                    nhưng chưa bao giờ có gì đứng vào: badge "Thiếu quyền Drive"
                    báo vấn đề mà không có cách nào xử lý, trong khi trang học
                    viên đã có đúng cái nút này từ lâu. */}
                {missingDriveIds.has(e.id) && (
                  <div className="shrink-0">
                    <AdminActionButton
                      action={retryDriveAccessForEnrollment}
                      id={e.id}
                      label="Cấp lại quyền Drive"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="mt-12 mb-4 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Khóa học
      </h3>
      {courses.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-6 text-sm leading-relaxed text-fg-muted">
          Chưa có cấu hình khóa học. Thêm bằng <code>prisma/seed.ts</code> — xem
          <code className="ml-1">prisma/courses.example.json</code>.
        </p>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => {
            const course = findCourse(c.slug);
            return (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-card border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{c.code}</Badge>
                    <p className="font-bold tracking-tight">
                      {course?.title ?? c.slug}
                    </p>
                    <Badge tone={c.status === "open" ? "success" : "cool"}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[13px] text-fg-subtle">
                    {vnd.format(c.priceVnd)}đ ·{" "}
                    {c.accessDays ? `${c.accessDays} ngày truy cập` : "không hết hạn"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 text-[13px]">
                  {/* Whether the three secrets are configured, never their values —
                      this page is rendered for an admin, but there is no reason
                      to put a live meeting URL in the HTML of a list view. */}
                  <span
                    className={
                      c.meetingUrl ? "text-success" : "text-fg-subtle"
                    }
                  >
                    {c.meetingUrl ? "✓ Link lớp" : "— chưa có link lớp"}
                  </span>
                  <span
                    className={
                      c.communityUrl ? "text-success" : "text-fg-subtle"
                    }
                  >
                    {c.communityUrl ? "✓ Nhóm học viên" : "— chưa có nhóm"}
                  </span>
                  <span
                    className={
                      c.driveFolderId ? "text-success" : "text-fg-subtle"
                    }
                  >
                    {c.driveFolderId ? "✓ Drive" : "— chưa có Drive"}
                  </span>
                  <span className="font-bold text-fg">
                    {occupiedSeats.get(c.id) ?? 0}/{c.capacity} chỗ
                  </span>
                  <form action={updateCourseStatus} className="flex items-center gap-2">
                    <input type="hidden" name="courseId" value={c.id} />
                    <select
                      name="status"
                      defaultValue={c.status}
                      aria-label={`Trạng thái ${course?.title ?? c.slug}`}
                      className="rounded-full border border-line bg-card px-3 py-2 text-sm text-fg"
                    >
                      <option value="draft">draft</option>
                      <option value="open">open</option>
                      <option value="running">running</option>
                      <option value="closed">closed</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-full border border-line px-3 py-2 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
                    >
                      Lưu
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="mt-12 mb-4 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Đánh giá khóa học
      </h3>
      {reviews.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-6 text-sm text-fg-muted">
          Chưa có đánh giá nào.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-4 rounded-card border border-line bg-card p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={review.rating} size={14} />
                  <Badge tone={reviewTone[review.status]}>
                    {reviewStatusLabel[review.status]}
                  </Badge>
                  <span className="text-[11px] text-fg-subtle">
                    {findCourse(review.course.slug)?.title ?? review.course.slug}
                  </span>
                </div>
                <p className="mt-1 break-all text-sm text-fg-muted">
                  {review.user.name ?? "—"} · {review.user.email} ·{" "}
                  {formatDateTime(review.createdAt)}
                </p>
                {review.comment && (
                  <p className="mt-2 text-[15px] leading-relaxed text-fg">
                    {review.comment}
                  </p>
                )}
              </div>
              {/* Dòng chờ duyệt có cả hai nút; dòng đã xử lý chỉ còn nút đưa nó
                  sang trạng thái kia. Nhờ vậy gỡ một đánh giá ĐANG HIỆN vẫn là
                  một cú bấm ngay tại đây — thao tác cần nhất khi có chuyện —
                  mà không phải mở thêm màn hình nào. */}
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {(["published", "rejected"] as const)
                  .filter((next) => next !== review.status)
                  .map((next) => (
                    <form key={next} action={moderateReview}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="status" value={next} />
                      <button
                        type="submit"
                        className="rounded-full border border-line px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
                      >
                        {next === "published" ? "Duyệt & đăng" : "Không đăng"}
                      </button>
                    </form>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-12 mb-4 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Đơn dịch vụ check AI
      </h3>
      {serviceOrders.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-6 text-sm text-fg-muted">
          Chưa có đơn dịch vụ nào.
        </p>
      ) : (
        <ul className="space-y-3">
          {serviceOrders.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-3 rounded-card border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold tabular-nums tracking-tight">
                    #{order.code}
                  </p>
                  <Badge tone={orderStatusTone[order.status] ?? "cool"}>
                    {orderStatusLabel[order.status] ?? order.status}
                  </Badge>
                </div>
                <p className="mt-1 break-all text-sm text-fg-muted">
                  {order.user.name ?? "—"} · {order.user.email}
                  {order.user.phone ? ` · ${order.user.phone}` : ""}
                </p>
                <p className="mt-1.5 text-[13px] text-fg-subtle">
                  {serviceKindLabel(order.kind)} · {vnd.format(order.wordCount)} từ ·{" "}
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <p className="shrink-0 text-lg font-bold tracking-tight text-primary">
                {vnd.format(order.amountVnd)}đ
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
