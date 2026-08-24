"use server";

import { revalidatePath } from "next/cache";
import { feedbackCopy } from "@/content/feedback";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { sendFeedbackReceivedEmail } from "@/lib/email";
import {
  normalizeBody,
  normalizeKind,
  normalizePagePath,
  normalizeTitle,
} from "@/lib/feedback-input";
import { prisma } from "@/lib/prisma";

export type FeedbackState = { error?: string; saved?: boolean };

export async function submitFeedback(
  _previous: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const session = await auth();
  if (!session?.user?.id) return { error: feedbackCopy.validation.signedOut };

  const kind = normalizeKind(formData.get("kind"));
  if (!kind) return { error: feedbackCopy.validation.kind };

  const title = normalizeTitle(formData.get("title"));
  if (!title) return { error: feedbackCopy.validation.title };

  const body = normalizeBody(formData.get("body"));
  if (!body) return { error: feedbackCopy.validation.body };

  if (!(await allowUserAction("feedback", session.user.id, 10))) {
    return { error: feedbackCopy.validation.throttle };
  }

  const created = await prisma.feedback.create({
    data: {
      userId: session.user.id,
      kind,
      title,
      body,
      pageUrl: normalizePagePath(formData.get("pageUrl")),
    },
    select: { user: { select: { name: true, email: true } } },
  });

  await sendFeedbackReceivedEmail({
    to: created.user.email,
    name: created.user.name,
    kind,
    title,
  }).catch((error) =>
    console.error("[feedback] Không gửi được thư cảm ơn:", error),
  );

  revalidatePath("/quan-tri");
  return { saved: true };
}
