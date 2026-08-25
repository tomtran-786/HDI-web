import type { Course } from "@/content/course";
import type { ServiceItem } from "@/content/services";
import { site } from "@/content/site";
import { appUrl } from "@/lib/app-url";

export function structuredDataForCourse(course: Course) {
  const base = appUrl();
  const url = `${base}/khoa-hoc/${course.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.intro,
      provider: { "@type": "Organization", name: site.name },
      offers: {
        "@type": "Offer",
        price: course.price.vnd,
        priceCurrency: "VND",
        url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: base },
        {
          "@type": "ListItem",
          position: 2,
          name: "Khóa học",
          item: `${base}/khoa-hoc`,
        },
        { "@type": "ListItem", position: 3, name: course.title, item: url },
      ],
    },
  ];
}

export function structuredDataForService(service: ServiceItem) {
  const base = appUrl();
  const url = `${base}${service.href}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.name,
      alternateName: service.nameVi,
      description: service.summary,
      url,
      provider: { "@type": "Organization", name: site.name },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: base },
        {
          "@type": "ListItem",
          position: 2,
          name: "Dịch vụ",
          item: `${base}/dich-vu`,
        },
        { "@type": "ListItem", position: 3, name: service.name, item: url },
      ],
    },
  ];
}
