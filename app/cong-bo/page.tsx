import type { Metadata } from "next";
import Link from "next/link";
import { Publications } from "@/components/sections/publications";
import { Projects } from "@/components/sections/projects";
import { Conferences } from "@/components/sections/conferences";
import { Teaching } from "@/components/sections/teaching";
import { about } from "@/content/about";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: `Công bố & hồ sơ học thuật — ${site.name}`,
  description: `Danh mục công bố quốc tế, dự án nghiên cứu được tài trợ, hội thảo và hồ sơ hướng dẫn của ${about.advisor.name}, ${about.advisor.label} của ${site.name}.`,
  alternates: { canonical: "/cong-bo" },
};

/**
 * The adviser's academic record, off the landing page. It is four long,
 * table-like sections that no visitor reads on the way to a course, so the home
 * page links here from the adviser block instead of carrying them inline.
 */
export default function AcademicRecordPage() {
  const advisor = about.advisor;

  return (
    <>
      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
          <Link
            href="/#ve-chung-toi"
            className="inline-flex items-center gap-2 text-sm font-semibold text-fg-muted transition hover:text-primary"
          >
            {/* IconArrow points up-right; a back link needs a plain left arrow,
                the same glyph convention the footer uses for "↗". */}
            <span aria-hidden>←</span>
            Về trang chủ
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {advisor.label}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Công bố &amp; hồ sơ học thuật
          </h1>
          <p className="mt-3 max-w-2xl text-base text-fg-muted sm:text-lg">
            Danh mục công bố, dự án được tài trợ, hội thảo quốc tế và hồ sơ hướng
            dẫn của {advisor.name} — {advisor.credential}.
          </p>
        </div>
      </section>

      <Publications />
      <Projects />
      <Conferences />
      <Teaching />
    </>
  );
}
