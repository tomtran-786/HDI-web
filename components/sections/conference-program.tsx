import Link from "next/link";
import { about } from "@/content/about";
import {
  conferenceProgram,
  conferenceProgramIntro,
} from "@/content/conference-program";
import { PhotoFigure } from "../activity-gallery";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { IconArrow } from "../ui/icons";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

/** Teaser trên trang chủ; toàn bộ bảng và quy trình nằm ở /hoi-thao-quoc-te. */
export function ConferenceProgram({ soft }: { soft?: boolean }) {
  // Một ảnh thật duy nhất trên trang chủ, gallery đầy đủ nằm ở /hoi-thao-quoc-te
  // và /ve-hdi để trang chủ vẫn gọn.
  const featuredPhoto = about.advisor.activityPhotos.find(
    (photo) => photo.id === "agba-2024",
  );

  return (
    <Section id="hoi-thao-quoc-te" soft={soft}>
      {/* Tiêu đề và lead chung một cột cạnh ảnh, để cột chữ đủ cao cân với ảnh
          thay vì để lead lơ lửng giữa khoảng trống. */}
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-12">
        <div>
          <SectionHeading
            eyebrow={conferenceProgramIntro.eyebrow}
            title={conferenceProgramIntro.title}
            mark={{ text: "xuất bản" }}
            subtitle={conferenceProgramIntro.subtitle}
          />
          <Reveal>
            <p className="max-w-2xl text-base leading-relaxed text-fg-muted sm:text-[17px]">
              {conferenceProgram.lead}
            </p>
          </Reveal>
        </div>
        {featuredPhoto && (
          <Reveal delay={100}>
            <PhotoFigure
              photo={featuredPhoto}
              sizes="(min-width: 1024px) 26rem, 100vw"
              className="mx-auto max-w-md lg:max-w-none"
            />
          </Reveal>
        )}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 sm:mt-12">
        {conferenceProgram.forums.map((forum, index) => (
          <Reveal key={forum.id} delay={index * 80} className="h-full">
            <Card className="flex h-full flex-col p-6 sm:p-8" hover={false}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                {forum.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-bold text-fg">{forum.name}</h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted sm:text-base">
                {forum.positioning}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {forum.outletChips.map((chip) => (
                  <Badge key={chip}>{chip}</Badge>
                ))}
              </div>
              <Link
                href={`/hoi-thao-quoc-te#${forum.id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Xem chi tiết
                <IconArrow size={15} />
              </Link>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Link
          href="/hoi-thao-quoc-te"
          className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          Xem toàn bộ chương trình đồng hành hội thảo
          <IconArrow size={15} />
        </Link>
      </Reveal>
    </Section>
  );
}
