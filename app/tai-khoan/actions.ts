"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reconcileDriveFolder } from "@/lib/fulfillment";

export async function retryDriveAccess(enrollmentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      userId: session.user.id,
      status: "paid",
      accessRevokedAt: null,
      OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }],
    },
    select: { id: true, cohort: { select: { driveFolderId: true } } },
  });
  if (!enrollment?.cohort.driveFolderId) return { ok: false };
  await reconcileDriveFolder(enrollment.cohort.driveFolderId, {
    enrollmentIds: [enrollment.id],
    limit: 1,
  });
  revalidatePath("/tai-khoan");
  return { ok: true };
}
