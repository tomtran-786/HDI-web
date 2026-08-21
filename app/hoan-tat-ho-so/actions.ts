"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone, PHONE_RE } from "@/lib/profile";
import { stages } from "@/content/account";
import { safeNext } from "@/lib/safe-path";
import type { ResearchStage } from "@/lib/generated/prisma/enums";

const allowedStages = new Set<string>(stages.map((s) => s.value));

/**
 * On failure the action echoes back what was submitted. Without this the form
 * re-renders from the (still empty) database row and silently wipes everything
 * the user just typed — which is how a one-field typo turns into filling the
 * whole form again.
 */
export type ProfileState = {
  error?: string;
  phone?: string;
  stage?: string;
};

export async function saveProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const next = safeNext(formData.get("tiep"));
  // A server action is its own endpoint — re-check the session here rather than
  // trusting the page that rendered the form.
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?tiep=${encodeURIComponent(next)}`);
  }

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const stage = String(formData.get("stage") ?? "");
  // Read before the validation returns below, so a rejected submit does not
  // forget where the student was headed.
  if (!PHONE_RE.test(phone)) {
    return {
      error: "Số điện thoại chưa đúng. Ví dụ: 0939979890 hoặc +84939979890.",
      phone,
      stage,
    };
  }
  // Never write a client-supplied string straight into an enum column.
  if (!allowedStages.has(stage)) {
    return { error: "Vui lòng chọn giai đoạn bạn đang ở.", phone, stage };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone, stage: stage as ResearchStage },
  });

  redirect(next);
}
