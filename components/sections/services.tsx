import Link from "next/link";
import { serviceCatalog } from "@/content/services";
import { Section, SectionHeading } from "../ui/section";

/**
 * Homepage chỉ giới thiệu hai nhóm; sáu dịch vụ đầy đủ nằm ở /dich-vu.
 *
 * Hình thức: bảng hai dòng. Cột trái là tên nhóm (chữ hẹp, như nhãn cột của
 * một bảng chương trình), cột phải là mô tả và liên kết — không còn hai thẻ
 * cạnh nhau.
 */
export function Services() {
  return (
    <Section id="dich-vu">
      <SectionHeading title={serviceCatalog.title} subtitle={serviceCatalog.subtitle} />

      <dl className="border-t-2 border-rule">
        {serviceCatalog.groups.map((group) => (
          <div
            key={group.id}
            id={group.id === "dong-hanh-nghien-cuu" ? "chuong-trinh" : undefined}
            className="grid scroll-mt-24 gap-x-10 gap-y-2 border-b border-line py-6 md:grid-cols-[14rem_minmax(0,1fr)]"
          >
            <dt className="font-cond text-base font-bold tracking-[0.06em] text-accent-text uppercase">
              {group.eyebrow}
            </dt>
            <dd>
              <h3 className="text-xl font-bold">{group.title}</h3>
              <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-fg-muted">
                {group.subtitle}
              </p>
              <Link
                href={`/dich-vu#${group.id}`}
                className="mt-3 inline-block text-[0.9375rem] font-semibold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Xem nhóm dịch vụ
                <span className="sr-only"> {group.title}</span>
              </Link>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
