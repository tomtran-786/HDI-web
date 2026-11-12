import type { Metadata } from "next";
import { Publications } from "@/components/sections/publications";
import { Projects } from "@/components/sections/projects";
import { Conferences } from "@/components/sections/conferences";
import { Teaching } from "@/components/sections/teaching";
import { ConferenceMap } from "@/components/conference-map";
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
          <h1 className="max-w-[22ch] text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[3.25rem]">
            Công bố &amp; hồ sơ học thuật
          </h1>
          <p className="mt-4 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
            Danh mục công bố, dự án được tài trợ, hội thảo quốc tế và hồ sơ hướng
            dẫn của {advisor.name} — {advisor.credential}.
          </p>

          {/* Bản đồ hội thảo mang cả bốn con số hồ sơ ở thẻ đáy, nên nó đứng
              trong khối mở đầu chứ không thành một băng riêng — băng riêng sẽ
              phá nhịp nền sáng/tối xen kẽ của các section phía sau. */}
          <div className="mt-10">
            <ConferenceMap />
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
