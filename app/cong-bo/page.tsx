import type { Metadata } from "next";
import { Publications } from "@/components/sections/publications";
import { Projects } from "@/components/sections/projects";
import { Conferences } from "@/components/sections/conferences";
import { Teaching } from "@/components/sections/teaching";
import { StatsBoard } from "@/components/stats-board";
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {advisor.label}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Công bố &amp; hồ sơ học thuật
          </h1>
          <p className="mt-3 max-w-2xl text-base text-fg-muted sm:text-lg">
            Danh mục công bố, dự án được tài trợ, hội thảo quốc tế và hồ sơ hướng
            dẫn của {advisor.name} — {advisor.credential}.
          </p>

          {/* Bốn con số này tóm tắt đúng bốn mục ngay bên dưới, nên chúng đứng
              trong khối mở đầu chứ không thành một băng riêng — băng riêng sẽ
              phá nhịp nền sáng/tối xen kẽ của các section phía sau. */}
          <div className="mt-10">
            <StatsBoard />
          </div>
        </div>
      </section>

      <Publications />
      <Projects />
      <Conferences />
      <Teaching />
    </>
  );
}
