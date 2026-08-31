import { prisma } from "./prisma";
import { liveAccessWhere } from "./enrollment";
import { acquireExternalLease } from "./external-lease";
import { findCourse } from "./courses";
import {
  sendGroupMemberEnrolledEmail,
  sendReferralCommissionEmail,
} from "./email";
import { grantDrivePermission, revokeDrivePermission } from "./google-drive";
import { creditBalanceVnd } from "./referral-ledger";

function externalErrorSummary(error: unknown) {
  const shaped = error as {
    code?: string | number;
    response?: { status?: string | number };
  };
  const status = shaped.code ?? shaped.response?.status;
  const message = error instanceof Error ? error.message : "Lỗi không xác định";
  return status ? `${status}: ${message}` : message;
}

export async function reconcileDriveFolder(
  folderId: string,
  options: { limit?: number; enrollmentIds?: string[] } = {},
) {
  if (options.enrollmentIds?.length === 0) {
    return { checked: 0, granted: 0, busy: false as const };
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 50));
  const lease = await acquireExternalLease(`drive:${folderId}`);
  if (!lease) return { checked: 0, granted: 0, busy: true as const };

  let checked = 0;
  let granted = 0;
  try {
    const candidates = await prisma.enrollment.findMany({
      where: {
        ...liveAccessWhere(new Date()),
        id: options.enrollmentIds ? { in: options.enrollmentIds } : undefined,
        drivePermissionId: null,
        course: { driveFolderId: folderId },
      },
      select: { id: true, user: { select: { email: true } } },
      orderBy: { paidAt: "asc" },
      take: limit,
    });
    checked = candidates.length;
    for (const enrollment of candidates) {
      try {
        if (!(await lease.renew())) {
          console.warn(`[drive] Lease folder=${folderId} đã mất trước khi grant.`);
          break;
        }
        const result = await grantDrivePermission(folderId, enrollment.user.email);
        const saved = await prisma.enrollment.updateMany({
          where: {
            id: enrollment.id,
            status: "paid",
            drivePermissionId: null,
            accessRevokedAt: null,
          },
          data: { drivePermissionId: result.permissionId },
        });
        granted += saved.count;
      } catch (error) {
        console.error(
          `[drive] Không cấp được folder=${folderId} enrollment=${enrollment.id}: ${externalErrorSummary(error)}`,
        );
      }
    }
    return { checked, granted, busy: false as const };
  } finally {
    await lease.release().catch((error) =>
      console.error(`[drive] Không nhả được lease folder=${folderId}:`, error),
    );
  }
}

export async function fulfillOrderDrive(orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: "paid" },
    select: {
      items: {
        select: {
          enrollmentId: true,
          course: { select: { driveFolderId: true, slug: true } },
        },
      },
    },
  });
  if (!order) return { folders: 0, granted: 0 };

  const folders = new Map<string, string[]>();
  for (const item of order.items) {
    if (!item.enrollmentId) continue;
    if (item.course.driveFolderId) {
      const ids = folders.get(item.course.driveFolderId) ?? [];
      ids.push(item.enrollmentId);
      folders.set(item.course.driveFolderId, ids);
    }
    else {
      console.error(
        `[drive] Đơn đã trả tiền nhưng ${item.course.slug} chưa có driveFolderId.`,
      );
    }
  }

  let granted = 0;
  for (const [folderId, enrollmentIds] of [...folders.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const result = await reconcileDriveFolder(folderId, {
      enrollmentIds,
      limit: enrollmentIds.length,
    });
    granted += result.granted;
  }
  return { folders: folders.size, granted };
}

/**
 * Báo cho từng thành viên rằng nhóm trưởng đã trả tiền ghi danh giúp họ.
 *
 * Chạy SAU khi cấp quyền Drive, vì thư nói "quyền đã được cấp vào email này".
 * Chỉ gửi cho người khác người trả tiền — với đơn lẻ, hàm này không gửi gì.
 *
 * Gửi thư không bao giờ được làm hỏng một đơn đã thu tiền: mỗi lần gửi tự nuốt
 * lỗi của mình, để một hộp thư từ chối không chặn thư của những người còn lại.
 *
 * Chạy lại được nhiều lần. Webhook PayOS có thể được giao lại, và lượt giao lại
 * PHẢI chạy lại phần này (xem `processPayosPayment`) vì lượt đầu có thể đã chết
 * sau khi commit thanh toán. `order_items.notified_at` là thứ giữ cho việc chạy
 * lại đó không thành một thư trùng: chỉ dòng nào chưa gửi được mới vào hàng, và
 * dấu chỉ được đóng sau khi Resend thật sự nhận thư. Một lease theo từng thành
 * viên còn chặn hai webhook giao lại cùng lúc cùng đọc được các dòng pending rồi
 * cùng gửi trước khi bất kỳ lượt nào kịp đóng dấu.
 */
export async function notifyGroupMembers(orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: "paid" },
    select: {
      code: true,
      userId: true,
      user: { select: { name: true, email: true } },
      items: {
        where: { notifiedAt: null },
        select: {
          id: true,
          memberUserId: true,
          member: { select: { name: true, email: true } },
          course: { select: { slug: true } },
        },
      },
    },
  });
  if (!order) return { notified: 0 };

  // Gom theo người: một thành viên mua ba khóa nhận MỘT thư liệt kê cả ba, chứ
  // không phải ba thư gần giống nhau.
  const byMember = new Map<
    string,
    { name: string; email: string; titles: string[]; itemIds: string[] }
  >();
  for (const item of order.items) {
    if (item.memberUserId === order.userId) continue;
    const entry = byMember.get(item.memberUserId) ?? {
      name: item.member.name ?? "",
      email: item.member.email,
      titles: [],
      itemIds: [],
    };
    const title = findCourse(item.course.slug)?.title ?? item.course.slug;
    if (!entry.titles.includes(title)) entry.titles.push(title);
    entry.itemIds.push(item.id);
    byMember.set(item.memberUserId, entry);
  }

  let notified = 0;
  for (const [memberUserId, member] of byMember) {
    const leaseKey = `group-email:${orderId}:${memberUserId}`;
    let lease: Awaited<ReturnType<typeof acquireExternalLease>> = null;

    try {
      lease = await acquireExternalLease(leaseKey);
      // Một webhook khác đang gửi cho đúng thành viên này. Không đợi: webhook
      // kia sẽ đóng notifiedAt nếu thành công; nếu nó chết, lease hết hạn thì một
      // redelivery sau lại có thể thử, đúng ngữ nghĩa at-least-once.
      if (!lease) continue;

      // Dữ liệu nhóm được đọc trước khi lấy lease. Nếu worker giữ lease ngay
      // trước đã gửi và đóng dấu, lượt này phải thấy trạng thái mới rồi dừng,
      // thay vì gửi lại từ snapshot cũ của `order.items`.
      if (!(await lease.renew())) {
        console.warn(`[group] Mất lease gửi thư ${leaseKey} trước khi gửi.`);
        continue;
      }
      const pending = await prisma.orderItem.count({
        where: { id: { in: member.itemIds }, notifiedAt: null },
      });
      if (pending === 0) continue;

      // ĐỌC kết quả, không chỉ `await`. `sendEmail` báo Resend từ chối bằng
      // `{ sent: false }` chứ không throw, nên `catch` bên dưới không bao giờ
      // chạy cho trường hợp đó — đúng cái bẫy đã làm mọi thư xác thực biến mất
      // trong khi trang đăng ký vẫn báo thành công. `try/catch` vẫn cần vì
      // `appUrl()` ném lỗi khi thiếu APP_URL ở production.
      const result = await sendGroupMemberEnrolledEmail({
        to: member.email,
        name: member.name,
        payerName: order.user.name ?? "",
        payerEmail: order.user.email,
        courseTitles: member.titles,
        orderCode: order.code,
      });
      if (result.sent) {
        // Đóng dấu SAU khi Resend nhận thư, không phải trước: một lá thư bị từ
        // chối phải còn cơ hội được gửi lại ở lượt webhook sau.
        await prisma.orderItem.updateMany({
          where: { id: { in: member.itemIds }, notifiedAt: null },
          data: { notifiedAt: new Date() },
        });
        notified += 1;
      } else {
        console.error(
          `[group] Thư ghi danh nhóm tới ${member.email} bị từ chối: ${result.error}`,
        );
      }
    } catch (error) {
      console.error(
        `[group] Không gửi được thư ghi danh nhóm cho ${member.email}:`,
        error,
      );
    } finally {
      if (lease) {
        await lease.release().catch((error) =>
          console.error(`[group] Không nhả được lease gửi thư ${leaseKey}:`, error),
        );
      }
    }
  }
  return { notified };
}

/**
 * Báo cho người giới thiệu biết họ vừa được cộng credits vì đơn này.
 *
 * Chạy SAU khi transaction của webhook đã commit, cạnh `notifyGroupMembers` và
 * vì cùng lý do: gửi thư trong transaction là giữ một hàng đơn bị khóa suốt một
 * lượt gọi mạng ra ngoài.
 *
 * `notifiedAt` trên dòng sổ là dấu chống gửi trùng, đúng vai trò của
 * `OrderItem.notifiedAt`: webhook được PayOS giao lại sẽ chạy lại phần giao
 * hàng, và không có dấu này thì mỗi lượt giao lại là một lá thư nữa.
 */
export async function notifyReferralCommission(orderId: string) {
  const entry = await prisma.referralLedger.findFirst({
    where: { orderId, type: "commission", status: "posted", notifiedAt: null },
    select: {
      id: true,
      userId: true,
      amountVnd: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!entry) return { notified: 0 };

  try {
    // ĐỌC kết quả, không chỉ `await`: `sendEmail` báo Resend từ chối bằng
    // `{ sent: false }` chứ không ném, nên `catch` bên dưới không bao giờ chạy
    // cho trường hợp đó.
    const result = await sendReferralCommissionEmail({
      to: entry.user.email,
      name: entry.user.name ?? "",
      amountVnd: entry.amountVnd,
      balanceVnd: await creditBalanceVnd(prisma, entry.userId),
    });
    if (!result.sent) {
      console.error(
        `[referral] Thư credits tới ${entry.user.email} bị từ chối: ${result.error}`,
      );
      return { notified: 0 };
    }
    // Đóng dấu SAU khi Resend nhận thư, để một lá thư bị từ chối còn cơ hội ở
    // lượt webhook sau.
    await prisma.referralLedger.updateMany({
      where: { id: entry.id, notifiedAt: null },
      data: { notifiedAt: new Date() },
    });
    return { notified: 1 };
  } catch (error) {
    console.error("[referral] Không gửi được thư credits:", error);
    return { notified: 0 };
  }
}

export async function reconcileMissingDriveGrants(limit = 50) {
  const budget = Math.max(1, Math.min(limit, 50));
  const candidates = await prisma.enrollment.findMany({
    where: {
      ...liveAccessWhere(new Date()),
      drivePermissionId: null,
      course: { driveFolderId: { not: null } },
    },
    select: { course: { select: { driveFolderId: true } } },
    orderBy: { paidAt: "asc" },
    take: budget,
  });
  const folders = new Set(
    candidates
      .map((item) => item.course.driveFolderId)
      .filter((id): id is string => Boolean(id)),
  );
  let checked = 0;
  let granted = 0;
  for (const folderId of [...folders].sort()) {
    const remaining = budget - checked;
    if (remaining <= 0) break;
    const result = await reconcileDriveFolder(folderId, { limit: remaining });
    checked += result.checked;
    granted += result.granted;
  }
  return { checked, granted };
}

export async function revokeExpiredDriveAccess(limit = 50, now = new Date()) {
  const expired = await prisma.enrollment.findMany({
    where: {
      status: "paid",
      accessRevokedAt: null,
      accessExpiresAt: { not: null, lte: now },
    },
    select: {
      id: true,
      userId: true,
      drivePermissionId: true,
      user: { select: { email: true } },
      course: { select: { driveFolderId: true } },
    },
    orderBy: { accessExpiresAt: "asc" },
    take: limit,
  });

  let revoked = 0;
  let kept = 0;
  let failed = 0;
  for (const enrollment of expired) {
    const folderId = enrollment.course.driveFolderId;
    if (!folderId) {
      const updated = await prisma.enrollment.updateMany({
        where: { id: enrollment.id, accessRevokedAt: null },
        data: { accessRevokedAt: now },
      });
      revoked += updated.count;
      continue;
    }

    const lease = await acquireExternalLease(`drive:${folderId}`);
    if (!lease) {
      failed += 1;
      continue;
    }
    try {
      if (!(await lease.renew())) {
        failed += 1;
        continue;
      }
      // Recheck while holding the same folder lease used by grants. Otherwise
      // a concurrent grant could save a permission id just before this worker
      // deletes that permission, leaving an active enrollment with a stale id.
      const otherActive = await prisma.enrollment.count({
        where: {
          ...liveAccessWhere(now),
          id: { not: enrollment.id },
          userId: enrollment.userId,
          course: { driveFolderId: folderId },
        },
      });
      if (otherActive > 0) {
        const updated = await prisma.enrollment.updateMany({
          where: { id: enrollment.id, accessRevokedAt: null },
          data: { accessRevokedAt: now },
        });
        kept += updated.count;
        continue;
      }

      await revokeDrivePermission(
        folderId,
        enrollment.user.email,
        enrollment.drivePermissionId,
      );
      const updated = await prisma.enrollment.updateMany({
        where: { id: enrollment.id, accessRevokedAt: null },
        data: { accessRevokedAt: now },
      });
      revoked += updated.count;
    } catch (error) {
      failed += 1;
      console.error(
        `[drive] Không thu hồi được enrollment=${enrollment.id}: ${externalErrorSummary(error)}`,
      );
    } finally {
      await lease.release().catch(() => undefined);
    }
  }
  return { checked: expired.length, revoked, kept, failed };
}
