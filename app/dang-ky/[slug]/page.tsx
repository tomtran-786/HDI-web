import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { findCourse } from "@/lib/courses";
import { heldByUser, openCohorts, seatsTaken } from "@/lib/cohorts";
import { formatDate, formatVnd } from "@/lib/format";
import { enrolPage } from "@/content/checkout";
import { links } from "@/content/site";
import { AddToCart } from "@/components/add-to-cart";
import { Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { IconArrow, IconMessage } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: PageProps<"/dang-ky/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = findCourse(slug);
  return {
    title: course
      ? `Đăng ký ${course.title} — HDI Research Center`
      : "Đăng ký — HDI Research Center",
  };
}

export default async function EnrolPage({
  params,
}: PageProps<"/dang-ky/[slug]">) {
  const { slug } = await params;
  const course = findCourse(slug);
  // An unknown slug is a 404, not an empty page: it is either a stale link or
  // someone probing, and neither deserves a rendered shell.
  if (!course) notFound();

  const session = await auth();
  const cohorts = await openCohorts(slug);
  const ids = cohorts.map((c) => c.id);

  const [taken, held] = await Promise.all([
    seatsTaken(ids),
    session?.user?.id
      ? heldByUser(session.user.id, ids)
      : Promise.resolve(new Map<string, string>()),
  ]);

  return (
    <Section soft>
      <SectionHeading
        eyebrow={enrolPage.eyebrow}
        title={course.title}
        subtitle={course.audience}
      />

      {cohorts.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-8 text-center sm:p-10">
          <p className="text-lg font-bold tracking-tight">
            {enrolPage.emptyTitle}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
            {enrolPage.emptyBody}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={links.zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              <IconMessage size={16} />
              Nhắn Zalo
            </a>
            <Link
              href="/#khoa-hoc"
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              Xem các khóa khác
              <IconArrow size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {cohorts.map((cohort) => {
              const seatsLeft = Math.max(
                0,
                cohort.capacity - (taken.get(cohort.id) ?? 0),
              );
              const blocked = held.has(cohort.id)
                ? ("already_enrolled" as const)
                : seatsLeft <= 0
                  ? ("no_seats" as const)
                  : null;

              return (
                <li
                  key={cohort.id}
                  className="flex flex-col gap-5 rounded-card border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{cohort.ky}</Badge>
                      {/* Scarcity only when it is actually scarce: "còn 38/40
                          chỗ" argues against buying. */}
                      {seatsLeft > 0 && seatsLeft <= 5 && (
                        <Badge tone="success">
                          {enrolPage.seatsLabel}: {seatsLeft}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2.5 text-lg font-bold tracking-tight">
                      Khai giảng {formatDate(cohort.khaiGiang)}
                    </p>
                    <p className="mt-1 text-sm text-fg-muted">
                      {cohort.lichHoc}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <p className="text-2xl font-bold tracking-tight text-primary">
                      {formatVnd(cohort.priceVnd)}
                    </p>
                    <AddToCart
                      cohortId={cohort.id}
                      courseSlug={cohort.courseSlug}
                      ky={cohort.ky}
                      blocked={blocked}
                      signedIn={Boolean(session?.user?.id)}
                      loginReturnTo={`/dang-ky/${slug}`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-fg-subtle">
            {enrolPage.listedPriceNote}
          </p>
        </>
      )}
    </Section>
  );
}
