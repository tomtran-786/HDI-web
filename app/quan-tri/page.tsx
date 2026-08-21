import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { findCourse } from "@/lib/courses";
import { formatDateTime } from "@/lib/format";
import { seatsTaken } from "@/lib/course-sales";
import { orderStatusLabel } from "@/content/checkout";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { cancelPendingOrder, updateCourseStatus } from "./actions";

export const metadata: Metadata = {
  title: "Quản trị — HDI Research Center",
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

const vnd = new Intl.NumberFormat("vi-VN");

const statusLabel: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

export default async function AdminPage() {
  const [orders, enrollments, courses, reviewPayments] = await Promise.all([
    // The reconciliation queue: money expected but not yet confirmed. There is
    // no "mark paid" button beside it, deliberately — confirmation belongs to
    // the payment webhook and nowhere else, so a row leaving this list is
    // evidence that the automated path worked.
    prisma.order.findMany({
      where: { status: { in: ["pending", "paid"] } },
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
        user: { select: { name: true, email: true, phone: true } },
        items: {
          select: {
            id: true,
            course: { select: { slug: true } },
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
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
            slug: true,
            priceVnd: true,
            driveFolderId: true,
          },
        },
      },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        capacity: true,
        priceVnd: true,
        accessDays: true,
        status: true,
        meetingUrl: true,
        driveFolderId: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        OR: [
          { status: "requires_review" },
          { status: "succeeded", order: { status: { not: "paid" } } },
        ],
      },
      orderBy: { receivedAt: "desc" },
      take: 25,
      select: {
        id: true,
        amountVnd: true,
        providerRef: true,
        receivedAt: true,
        order: {
          select: {
            code: true,
            status: true,
            amountVnd: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
  ]);
  const occupiedSeats = await seatsTaken(courses.map((course) => course.id));

  const awaitingPayment = orders.filter((o) => o.status === "pending");
  const missingDrive = enrollments.filter(
    (e) =>
      e.status === "paid" &&
      !e.accessRevokedAt &&
      (!e.accessExpiresAt || e.accessExpiresAt > new Date()) &&
      e.course.driveFolderId &&
      !e.drivePermissionId,
  );

  return (
    <Section soft>
      <SectionHeading
        eyebrow="Quản trị"
        title="Ghi danh & khóa học"
        subtitle={`${awaitingPayment.length} đơn chờ thanh toán · ${reviewPayments.length} giao dịch cần kiểm tra · ${missingDrive.length} quyền Drive đang thiếu.`}
      />

      {reviewPayments.length > 0 && (
        <div className="mb-10 rounded-card border border-primary bg-tint p-5 sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
            Thanh toán cần kiểm tra thủ công
          </h3>
          <ul className="mt-4 space-y-3">
            {reviewPayments.map((payment) => (
              <li key={payment.id} className="text-sm text-fg-muted">
                Đơn #{payment.order.code} · nhận {vnd.format(payment.amountVnd)}đ / chờ {vnd.format(payment.order.amountVnd)}đ · {payment.order.user.email} · ref {payment.providerRef}
              </li>
            ))}
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
                  <Badge tone={order.status === "paid" ? "success" : "cool"}>
                    {orderStatusLabel[order.status] ?? order.status}
                  </Badge>
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
                        findCourse(item.course.slug)?.title ?? item.course.slug,
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
                  <form
                    action={async () => {
                      "use server";
                      await cancelPendingOrder(order.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
                    >
                      Hủy đơn
                    </button>
                  </form>
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
                      {statusLabel[e.status] ?? e.status}
                    </Badge>
                    {missingDrive.some((item) => item.id === e.id) && (
                      <Badge tone="cool">Thiếu quyền Drive</Badge>
                    )}
                  </div>
                  {/* break-all: a long address must wrap instead of pushing the
                      row wide and giving the page a horizontal scrollbar. */}
                  <p className="mt-1 break-all text-sm text-fg-muted">
                    {e.user.email}
                  </p>
                  <p className="mt-1.5 text-[13px] text-fg-subtle">
                    {course?.title ?? e.course.slug} ·{" "}
                    {vnd.format(e.course.priceVnd)}đ · ghi danh{" "}
                    {dateFmt.format(e.createdAt)}
                  </p>
                </div>

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
                  {/* Whether the two secrets are configured, never their values —
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
    </Section>
  );
}
