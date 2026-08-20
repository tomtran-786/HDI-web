import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { findCourse } from "@/lib/courses";
import { formatDateTime } from "@/lib/format";
import { orderStatusLabel } from "@/content/checkout";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { markCancelled } from "./actions";

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
  const [orders, enrollments, cohorts] = await Promise.all([
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
            cohort: { select: { courseSlug: true, ky: true } },
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
        user: { select: { name: true, email: true } },
        cohort: { select: { courseSlug: true, ky: true, priceVnd: true } },
      },
    }),
    prisma.cohort.findMany({
      orderBy: { khaiGiang: "asc" },
      select: {
        id: true,
        courseSlug: true,
        ky: true,
        khaiGiang: true,
        capacity: true,
        status: true,
        meetingUrl: true,
        driveFolderId: true,
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  const awaitingPayment = orders.filter((o) => o.status === "pending");

  return (
    <Section soft>
      <SectionHeading
        eyebrow="Quản trị"
        title="Ghi danh & kỳ học"
        subtitle={`${awaitingPayment.length} đơn đang chờ thanh toán. Xác nhận là việc của webhook — trang này chỉ để theo dõi.`}
      />

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
                        `${findCourse(item.cohort.courseSlug)?.title ?? item.cohort.courseSlug} · ${item.cohort.ky}`,
                    )
                    .join(" — ")}
                </p>
                {order.status === "pending" && (
                  <p className="mt-1 text-[13px] text-fg-subtle">
                    Giữ chỗ đến {formatDateTime(order.expiresAt)}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-lg font-bold tracking-tight text-primary">
                {vnd.format(order.amountVnd)}đ
              </p>
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
            const course = findCourse(e.cohort.courseSlug);
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
                  </div>
                  {/* break-all: a long address must wrap instead of pushing the
                      row wide and giving the page a horizontal scrollbar. */}
                  <p className="mt-1 break-all text-sm text-fg-muted">
                    {e.user.email}
                  </p>
                  <p className="mt-1.5 text-[13px] text-fg-subtle">
                    {course?.title ?? e.cohort.courseSlug} · {e.cohort.ky} ·{" "}
                    {vnd.format(e.cohort.priceVnd)}đ · ghi danh{" "}
                    {dateFmt.format(e.createdAt)}
                  </p>
                </div>

                {(e.status === "pending" || e.status === "paid") && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await markCancelled(e.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
                      >
                        Hủy
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="mt-12 mb-4 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Kỳ học
      </h3>
      {cohorts.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-6 text-sm leading-relaxed text-fg-muted">
          Chưa có kỳ học nào. Thêm bằng <code>prisma/seed.ts</code> — xem
          <code className="ml-1">prisma/cohorts.example.json</code>.
        </p>
      ) : (
        <ul className="space-y-3">
          {cohorts.map((c) => {
            const course = findCourse(c.courseSlug);
            return (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-card border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold tracking-tight">
                      {course?.title ?? c.courseSlug}
                    </p>
                    <Badge>{c.ky}</Badge>
                  </div>
                  <p className="mt-1.5 text-[13px] text-fg-subtle">
                    Khai giảng {dateFmt.format(c.khaiGiang)} · {c.status}
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
                    {c._count.enrollments}/{c.capacity}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
