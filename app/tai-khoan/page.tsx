import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findCourse } from "@/lib/courses";
import { links } from "@/content/site";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import {
  IconArrow,
  IconCalendar,
  IconFolder,
  IconMessage,
  IconReceipt,
  IconVideo,
} from "@/components/ui/icons";
import { retryDriveAccess } from "./actions";
import { LogoutButton } from "./logout-button";

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

/** Access is live only while all three conditions hold. */
function hasLiveAccess(e: {
  status: string;
  accessRevokedAt: Date | null;
  accessExpiresAt: Date | null;
}) {
  if (e.status !== "paid") return false;
  if (e.accessRevokedAt !== null) return false;
  if (e.accessExpiresAt && e.accessExpiresAt <= new Date()) return false;
  return true;
}

const statusLabel: Record<string, string> = {
  pending: "Chờ xác nhận thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

export default async function AccountPage() {
  const session = await auth();
  // The layout already redirected, so this is only for TypeScript.
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  // NOTE: `meetingUrl` and `driveFolderId` are deliberately absent from this
  // select. `include: { cohort: true }` would pull both into the rendered
  // payload even though no JSX reads them — which is exactly how a "hidden in
  // the UI" secret ends up in view-source.
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      accessExpiresAt: true,
      accessRevokedAt: true,
      drivePermissionId: true,
      cohort: {
        select: {
          id: true,
          courseSlug: true,
          ky: true,
          khaiGiang: true,
          lichHoc: true,
        },
      },
    },
  });

  // Second query, only for the intakes this student has actually paid for.
  const liveCohortIds = enrollments
    .filter(hasLiveAccess)
    .map((e) => e.cohort.id);

  const secrets = new Map<
    string,
    { meetingUrl: string | null; driveFolderId: string | null }
  >();
  if (liveCohortIds.length > 0) {
    const rows = await prisma.cohort.findMany({
      where: { id: { in: liveCohortIds } },
      select: { id: true, meetingUrl: true, driveFolderId: true },
    });
    for (const r of rows) {
      secrets.set(r.id, {
        meetingUrl: r.meetingUrl,
        driveFolderId: r.driveFolderId,
      });
    }
  }

  return (
    <Section soft>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Khu vực học viên"
          title={`Chào ${session.user.name ?? "bạn"}`}
          subtitle="Các kỳ học bạn đã ghi danh, lịch học và tài liệu."
        />
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
            Bạn chưa ghi danh kỳ học nào
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
            Sau khi đăng ký và hoàn tất học phí, kỳ học của bạn sẽ hiện ở đây
            cùng link vào lớp và kho record.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/#khoa-hoc"
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
            const course = findCourse(e.cohort.courseSlug);
            const live = hasLiveAccess(e);
            const secret = secrets.get(e.cohort.id);

            return (
              <div
                key={e.id}
                className="flex flex-col rounded-card border border-line bg-card p-6 sm:p-7"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                      {e.cohort.ky}
                    </p>
                    <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight">
                      {/* An orphan slug must not blank the card — show the raw
                          slug so the problem is visible instead of silent. */}
                      {course?.title ?? e.cohort.courseSlug}
                    </h3>
                  </div>
                  <Badge tone={live ? "success" : "cool"}>
                    {statusLabel[e.status] ?? e.status}
                  </Badge>
                </div>

                <dl className="mt-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5">
                    <dt className="text-[13px] text-fg-muted">Khai giảng</dt>
                    <dd className="text-[15px] font-bold text-fg">
                      {dateFmt.format(e.cohort.khaiGiang)}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5">
                    <dt className="text-[13px] text-fg-muted">Lịch học</dt>
                    <dd className="text-[15px] font-semibold text-fg">
                      {e.cohort.lichHoc}
                    </dd>
                  </div>
                  {e.accessExpiresAt && (
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5 last:border-0">
                      <dt className="text-[13px] text-fg-muted">
                        Xem lại đến
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
                      {!secret?.meetingUrl && !secret?.driveFolderId && (
                        <p className="text-sm leading-relaxed text-fg-muted">
                          Link vào lớp sẽ được cập nhật trước ngày khai giảng.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-card border border-line bg-bg-soft px-4 py-3">
                      <IconCalendar
                        size={16}
                        className="mt-0.5 shrink-0 text-fg-subtle"
                      />
                      <p className="text-sm leading-relaxed text-fg-muted">
                        {e.status === "pending"
                          ? "Link vào lớp và kho record sẽ mở ngay khi học phí được xác nhận."
                          : "Kỳ học này hiện không còn quyền truy cập."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
