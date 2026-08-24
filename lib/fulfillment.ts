import { prisma } from "./prisma";
import { liveAccessWhere } from "./enrollment";
import { acquireExternalLease } from "./external-lease";
import { grantDrivePermission, revokeDrivePermission } from "./google-drive";

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
