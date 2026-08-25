import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SERVICE_SLUGS, serviceCatalog, serviceForSlug } from "@/content/services";
import { structuredDataForService } from "@/lib/structured-data";

class NotFoundSignal extends Error {}

const mocks = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/analytics", () => ({ trackCta: vi.fn() }));

import ServicesPage from "@/app/dich-vu/page";
import ServiceDetailPage, { generateStaticParams } from "@/app/dich-vu/[slug]/page";

beforeEach(() => {
  mocks.notFound.mockImplementation(() => {
    throw new NotFoundSignal();
  });
});

describe("hub và landing dịch vụ", () => {
  it("hub render đủ hai nhóm và sáu dịch vụ", () => {
    const html = renderToStaticMarkup(<ServicesPage />);
    const items = serviceCatalog.groups.flatMap((group) => group.items);

    expect(html).toContain('id="dong-hanh-nghien-cuu"');
    expect(html).toContain('id="ho-tro-ban-thao"');
    expect(items).toHaveLength(6);
    for (const item of items) expect(html).toContain(`href="${item.href}"`);
    expect(html).not.toContain("←");
  });

  it("tạo sẵn đúng năm landing generic", () => {
    expect(generateStaticParams()).toEqual(
      SERVICE_SLUGS.map((slug) => ({ slug })),
    );
  });

  it("landing nghiên cứu render đúng thứ tự các block và JSON-LD", async () => {
    const service = serviceForSlug("research-coaching-1-1")!;
    const html = renderToStaticMarkup(
      await ServiceDetailPage({
        params: Promise.resolve({ slug: "research-coaching-1-1" }),
      }),
    );

    const headings = [
      "Giới thiệu dịch vụ",
      "Phù hợp với ai",
      service.supportLabel!,
      "Liên hệ đội ngũ HDI",
    ];
    const positions = headings.map((heading) => html.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toContain("←");
    expect(structuredDataForService(service)).toMatchObject([
      { "@type": "Service", name: service.name },
      { "@type": "BreadcrumbList" },
    ]);
  });

  it("Humanizing chỉ có ghi chú và CTA, không dựng block giả", async () => {
    const html = renderToStaticMarkup(
      await ServiceDetailPage({
        params: Promise.resolve({ slug: "humanizing-proofreading" }),
      }),
    );

    expect(html).toContain("Liên hệ để biết chi tiết và báo giá.");
    expect(html).toContain("Liên hệ đội ngũ HDI");
    expect(html).not.toContain("Phù hợp với ai");
    expect(html).not.toContain("Nội dung hỗ trợ");
  });

  it("route AI không bị nhân đôi trong tập slug generic", () => {
    expect(SERVICE_SLUGS).not.toContain("kiem-tra-ai-dao-van");
    expect(serviceCatalog.groups[1].items[0].href).toBe("/kiem-tra-ai-dao-van");
  });

  it("slug lạ trả 404", async () => {
    await expect(
      ServiceDetailPage({
        params: Promise.resolve({ slug: "khong-ton-tai" }),
      }),
    ).rejects.toBeInstanceOf(NotFoundSignal);
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
