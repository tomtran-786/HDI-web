import type { Metadata } from "next";
import Link from "next/link";
import { currentSession } from "@/lib/current-session";
import { prisma } from "@/lib/prisma";
import { hasLiveAccess } from "@/lib/enrollment";
import { findCourse } from "@/lib/courses";
import { links } from "@/content/site";
import { serviceKindLabel } from "@/content/ai-check";
import {
  enrollmentStatusLabel,
  orderStatusLabel,
  orderStatusTone,
} from "@/content/checkout";
import { formatVnd } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import {
  IconArrow,
  IconFolder,
  IconMessage,
  IconReceipt,
  IconVideo,
} from "@/components/ui/icons";
import { retryDriveAccess } from "./actions";
import { LogoutButton } from "./logout-button";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = {
  title: "Tài khoản — HDI Research Center",
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

function enrollmentLabel(e: {
  status: string;
  accessRevokedAt: Date | null;
  accessExpiresAt: Date | null;
}, now: Date) {
  if (e.status === "paid" && e.accessRevokedAt) return "Đã thu hồi quyền";
  if (e.status === "paid" && e.accessExpiresAt && e.accessExpiresAt <= now) {
    return "Đã hết hạn truy cập";
  }
  return enrollmentStatusLabel[e.status] ?? e.status;
}

export default async function AccountPage() {
  const session = await currentSession();
  // The layout already redirected, so this is only for TypeScript.
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  // NOTE: `meetingUrl`, `communityUrl` and `driveFolderId` are deliberately absent from this
  // select. `include: { course: true }` would pull both into the rendered
  // payload even though no JSX reads them — which is exactly how a "hidden in
  // the UI" secret ends up in view-source.
  const [enrollments, serviceOrders, reviewRows] = await Promise.all([
    prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      paidAt: true,
      createdAt: true,
      accessExpiresAt: true,
      accessRevokedAt: true,
      drivePermissionId: true,
      course: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
    }),

  // Đơn dịch vụ của chính người này. Sau khi thanh toán, trang kết quả là nơi
  // có mã đơn để gửi bài qua Zalo — đóng tab xong thì đây là đường quay lại.
    prisma.serviceOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      ref: true,
      code: true,
      kind: true,
      wordCount: true,
      amountVnd: true,
      status: true,
      createdAt: true,
    },
    }),

  // Đánh giá của CHÍNH người này, mọi trạng thái — form phải nạp lại được cả
  // bản đang chờ duyệt lẫn bản bị từ chối, nếu không học viên sẽ tưởng lần gửi
  // trước bị mất và gõ lại từ đầu.
    prisma.courseReview.findMany({
      where: { userId },
      select: { courseId: true, rating: true, comment: true, status: true },
    }),
  ]);
  const myReviews = new Map(reviewRows.map((review) => [review.courseId, review]));

  // Một khóa chỉ có một đánh giá, nhưng một học viên có thể mua lại khóa đó và
  // do đó có nhiều thẻ ghi danh. Form chỉ mọc trên thẻ đầu tiên của mỗi khóa;
  // hai form cùng ghi vào một hàng là hai form ghi đè lẫn nhau.
  const reviewFormShown = new Set<string>();

  // Second query, only for courses this student currently has access to.
  const now = new Date();
  const liveCourseIds = enrollments
    .filter((enrollment) => hasLiveAccess(enrollment, now))
    .map((e) => e.course.id);

  const secrets = new Map<
    string,
    {
      meetingUrl: string | null;
      communityUrl: string | null;
      driveFolderId: string | null;
    }
  >();
  if (liveCourseIds.length > 0) {
    const rows = await prisma.course.findMany({
      where: { id: { in: liveCourseIds } },
      select: {
        id: true,
        meetingUrl: true,
        communityUrl: true,
        driveFolderId: true,
      },
    });
    for (const r of rows) {
      secrets.set(r.id, {
        meetingUrl: r.meetingUrl,
        communityUrl: r.communityUrl,
        driveFolderId: r.driveFolderId,
      });
    }
  }

  return (
    <Section soft>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar
            src={session.user.image}
            name={session.user.name}
            email={session.user.email}
            size="lg"
            className="mt-1"
          />
          <SectionHeading
            eyebrow="Khu vực học viên"
            title={`Chào ${session.user.name ?? "bạn"}`}
            subtitle="Các khóa học, thời hạn truy cập và tài liệu của bạn."
          />
        </div>
        <div className="mb-10 flex flex-wrap items-center gap-3 sm:mb-12">
          <Link
            href="/tai-khoan/don-hang"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
          >
            <IconReceipt size={16} />
            Đơn hàng
          </Link>
          <LogoutButton />
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-8 text-center sm:p-10">
          <p className="text-lg font-bold tracking-tight">
            Bạn chưa mua khóa học nào
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
            Sau khi thanh toán, khóa học sẽ hiện ở đây cùng link vào lớp và kho
            tài liệu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/khoa-hoc"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Xem các khóa học
              <IconArrow size={16} />
            </Link>
            <a
              href={links.zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              <IconMessage size={16} />
              Nhắn Zalo
            </a>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {enrollments.map((e) => {
            const course = findCourse(e.course.slug);
            const live = hasLiveAccess(e, now);
            const secret = secrets.get(e.course.id);
            const canRate =
              e.status === "paid" && !reviewFormShown.has(e.course.id);
            if (canRate) reviewFormShown.add(e.course.id);
            const myReview = myReviews.get(e.course.id);

            return (
              <div
                key={e.id}
                className="flex flex-col rounded-card border border-line bg-card p-6 sm:p-7"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                      Khóa học
                    </p>
                    <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight">
                      {/* An orphan slug must not blank the card — show the raw
                          slug so the problem is visible instead of silent. */}
                      {course?.title ?? e.course.slug}
                    </h3>
                  </div>
                  <Badge tone={live ? "success" : "cool"}>
                    {enrollmentLabel(e, now)}
                  </Badge>
                </div>

                <dl className="mt-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5">
                    <dt className="text-[13px] text-fg-muted">
                      {e.paidAt ? "Thanh toán" : "Đặt chỗ"}
                    </dt>
                    <dd className="text-[15px] font-bold text-fg">
                      {dateFmt.format(e.paidAt ?? e.createdAt)}
                    </dd>
                  </div>
                  {e.accessExpiresAt && (
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5 last:border-0">
                      <dt className="text-[13px] text-fg-muted">
                        Truy cập đến
                      </dt>
                      <dd className="text-[15px] font-semibold text-fg">
                        {dateFmt.format(e.accessExpiresAt)}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-auto pt-6">
                  {live ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      {secret?.communityUrl && (
                        <a
                          href={secret.communityUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
                        >
                          <IconMessage size={16} />
                          Vào nhóm Zalo
                        </a>
                      )}
                      {secret?.meetingUrl && (
                        <a
                          href={secret.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
                        >
                          <IconVideo size={16} />
                          Vào lớp
                        </a>
                      )}
                      {secret?.driveFolderId && e.drivePermissionId && (
                        <a
                          href={`https://drive.google.com/drive/folders/${secret.driveFolderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
                        >
                          <IconFolder size={16} />
                          Kho record
                        </a>
                      )}
                      {secret?.driveFolderId && !e.drivePermissionId && (
                        <form
                          className="flex-1"
                          action={async () => {
                            "use server";
                            await retryDriveAccess(e.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
                          >
                            <IconFolder size={16} />
                            Thử cấp lại quyền record
                          </button>
                        </form>
                      )}
                      {!secret?.communityUrl &&
                        !secret?.meetingUrl &&
                        !secret?.driveFolderId && (
                        <p className="text-sm leading-relaxed text-fg-muted">
                          Link vào lớp sẽ được cập nhật khi khóa học sẵn sàng.
                        </p>
                        )}
                    </div>
                  ) : (
                    <div className="rounded-card border border-line bg-bg-soft px-4 py-3">
                      <p className="text-sm leading-relaxed text-fg-muted">
                        {e.status === "pending"
                          ? "Link vào lớp và kho tài liệu sẽ mở ngay khi học phí được xác nhận."
                          : "Lần mua này hiện không còn quyền truy cập. Lịch sử vẫn được giữ để bạn đối chiếu."}
                      </p>
                    </div>
                  )}
                </div>

                {canRate && (
                  <ReviewForm
                    courseId={e.course.id}
                    defaultRating={myReview?.rating}
                    defaultComment={myReview?.comment}
                    status={myReview?.status}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {serviceOrders.length > 0 && (
        <>
          <h3 className="mt-12 mb-4 text-sm font-bold uppercase tracking-[0.16em] text-fg-subtle">
            Đơn dịch vụ
          </h3>
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
                  <p className="mt-1 text-sm text-fg-muted">
                    {serviceKindLabel(order.kind)} ·{" "}
                    {order.wordCount.toLocaleString("vi-VN")} từ ·{" "}
                    {dateFmt.format(order.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-4">
                  <p className="text-lg font-bold tracking-tight text-primary">
                    {formatVnd(order.amountVnd)}
                  </p>
                  <Link
                    href={`/kiem-tra-ai-dao-van/ket-qua/${order.ref}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
                  >
                    Xem đơn
                    <IconArrow size={15} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
