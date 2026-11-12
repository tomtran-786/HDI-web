import Link from "next/link";
import { about } from "@/content/about";
import {
  conferenceProgram,
  conferenceProgramIntro,
} from "@/content/conference-program";
import { PhotoFigure } from "../activity-gallery";
import { Section, SectionHeading } from "../ui/section";

/**
 * Teaser trên trang chủ; toàn bộ bảng và quy trình nằm ở /hoi-thao-quoc-te.
 *
 * Hình thức: một ảnh hội thảo thật cỡ lớn, cạnh đó là hai diễn đàn dưới dạng
 * danh sách kẻ — không phải lưới thẻ.
 */
export function ConferenceProgram() {
  const featuredPhoto = about.advisor.activityPhotos.find(
    (photo) => photo.id === "agba-2024",
  );

  return (
    <Section id="hoi-thao-quoc-te">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <SectionHeading
            title={conferenceProgramIntro.title}
            subtitle={conferenceProgramIntro.subtitle}
          />
          <ul className="border-t-2 border-rule">
            {conferenceProgram.forums.map((forum) => (
              <li key={forum.id} className="border-b border-line py-5">
                <h3 className="text-xl font-bold">
                  <Link
                    href={`/hoi-thao-quoc-te#${forum.id}`}
                    className="hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    {forum.name}
                  </Link>
                </h3>
                <p className="mt-0.5 text-sm text-fg-subtle">{forum.eyebrow}</p>
                <p className="mt-2 max-w-[60ch] text-[0.9375rem] leading-relaxed text-fg-muted">
                  {forum.positioning}
                </p>
                <p className="mt-2 font-cond text-sm font-semibold text-fg">
                  {forum.outletChips.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/hoi-thao-quoc-te"
            className="mt-6 inline-block text-[0.9375rem] font-semibold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Toàn bộ chương trình đồng hành hội thảo
          </Link>
        </div>
        {featuredPhoto && (
          <PhotoFigure
            photo={featuredPhoto}
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="lg:mt-2"
          />
        )}
      </div>
    </Section>
  );
}
