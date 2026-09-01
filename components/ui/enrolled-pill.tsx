import { enrolledCount, enrolledLabel } from "@/content/course-hype";
import type { CourseSlug } from "@/content/course";
import { formatCount } from "@/lib/format";
import { IconUser } from "./icons";

const avatarOpacity = ["opacity-100", "opacity-85", "opacity-70"] as const;

export function EnrolledPill({ slug }: { slug: CourseSlug }) {
  const count = enrolledCount[slug];

  return (
    <div
      className="inline-flex max-w-full items-center gap-2.5 self-start rounded-full border border-line px-3 py-2"
      style={{
        background: "linear-gradient(90deg, var(--tint), transparent)",
      }}
    >
      <span className="flex shrink-0 pl-2" aria-hidden>
        {avatarOpacity.map((opacity) => (
          <span
            key={opacity}
            className={`-ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-tint text-primary ring-2 ring-card ${opacity}`}
          >
            <IconUser size={13} />
          </span>
        ))}
      </span>
      <span className="hype-live h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden />
      <span className="min-w-0 text-xs leading-tight text-fg-muted">
        <span className="font-bold tabular-nums text-primary">
          {formatCount(count)}
        </span>{" "}
        {enrolledLabel}
      </span>
    </div>
  );
}
