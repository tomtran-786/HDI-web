import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isProfileComplete } from "@/lib/profile";
import { safeNext } from "@/lib/safe-path";
import { profileIntro } from "@/content/account";
import { Section, SectionHeading } from "@/components/ui/section";
import { ProfileForm } from "./form";

export const metadata: Metadata = {
  title: "Hoàn tất hồ sơ — HDI Research Center",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  searchParams,
}: PageProps<"/hoan-tat-ho-so">) {
  const { tiep } = await searchParams;
  const next = safeNext(tiep);
  const signIn = `/dang-nhap?tiep=${encodeURIComponent(next)}`;

  const session = await auth();
  if (!session?.user?.id) redirect(signIn);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, stage: true },
  });
  if (!user) redirect(signIn);

  // Already done — nothing to ask. Guard here as well as in the dashboard so
  // the page cannot be reached as a dead end.
  if (isProfileComplete(user)) redirect(next);

  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading
          align="center"
          eyebrow={profileIntro.eyebrow}
          title={profileIntro.title}
          subtitle={profileIntro.subtitle}
        />

        {/* What Google already gave us, shown read-only so it is obvious why we
            are only asking for two things. */}
        <dl className="mb-5 rounded-card border border-line bg-bg-soft px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 py-1">
            <dt className="text-[13px] text-fg-muted">Họ và tên</dt>
            <dd className="text-[15px] font-semibold text-fg">{user.name ?? "—"}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 py-1">
            <dt className="text-[13px] text-fg-muted">Email</dt>
            <dd className="break-all text-[15px] font-semibold text-fg">{user.email}</dd>
          </div>
        </dl>

        <ProfileForm
          defaultPhone={user.phone ?? ""}
          defaultStage={user.stage ?? ""}
          next={next}
        />
      </div>
    </Section>
  );
}
