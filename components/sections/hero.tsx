import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import { CtaLink } from "../ui/cta-link";
import { Reveal } from "../ui/reveal";
import { IconArrow, IconCheck, IconClock, IconMessage, IconUser } from "../ui/icons";

/** Hàng cam kết dịch vụ, khớp với dải cam kết in trong ảnh promo bên phải. */
const promises = [
  { icon: IconCheck, title: "Bảo mật tuyệt đối", desc: "Không lưu trữ tài liệu" },
  { icon: IconClock, title: "Kết quả nhanh", desc: "Chỉ từ 5–30 phút" },
  { icon: IconMessage, title: "Hỗ trợ tận tâm", desc: "Giải đáp mọi thắc mắc" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-bg">
      {/* Một lớp wash thương hiệu nhẹ phía sau hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(55%_90%_at_72%_0%,var(--tint)_0%,transparent_72%)]"
      />
      <div className="shell relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_0.95fr] lg:py-28">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full bg-tint px-3 py-1.5 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Khóa mới khai giảng 07/09/2026
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-primary">Nghiên cứu bài bản,</span>
            <br />
            <span className="text-fg">công bố quốc tế</span>
          </h1>

          <p className="mt-4 text-lg font-semibold text-primary">
            {"// "}
            {site.tagline}
          </p>

          {/* lg:max-w-md để chừa chỗ cho ảnh promo lấn sang từ bên phải */}
          <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg lg:max-w-md">
            {site.name} đồng hành cùng bạn từ khâu xác định câu hỏi nghiên cứu đến
            lúc gửi bài và trả lời phản biện tại các tạp chí quốc tế — qua các lộ
            trình đồng hành nghiên cứu, khóa đào tạo và dịch vụ hỗ trợ bản thảo.{" "}
            {site.lead.role}:{" "}
            <strong className="font-semibold text-fg">{site.lead.name}</strong> —{" "}
            {site.lead.credential}.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 lg:max-w-md">
            <CtaLink
              source="hero"
              target="tu-van"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition-colors hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Đăng ký tư vấn miễn phí
              <IconArrow size={16} />
            </CtaLink>

            <Link
              href="/dich-vu#dong-hanh-nghien-cuu"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3 text-sm font-bold text-fg transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Xem lộ trình đồng hành
            </Link>
          </div>

          <ul className="mt-8 grid gap-x-4 gap-y-3 rounded-card border border-line bg-bg-soft/50 p-4 sm:grid-cols-3 lg:max-w-lg">
            {promises.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-2.5">
                <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
                <span className="leading-tight">
                  <span className="block text-[13px] font-bold text-fg">{title}</span>
                  <span className="block text-[11px] text-fg-muted">{desc}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-4 border-t border-line pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
              <IconUser size={20} />
            </div>
            <div className="text-sm">
              <p className="font-bold text-fg">
                {site.lead.role}: {site.lead.name}
              </p>
              <p className="text-xs text-fg-muted">
                {site.lead.credential} · Đồng hành cùng 500+ học viên & nghiên cứu sinh
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal
          delay={120}
          className="justify-self-center lg:justify-self-stretch"
        >
          {/* Ảnh promo dịch vụ check Turnitin (HDI cung cấp). Trên màn lớn ảnh
              phóng to và tràn sang trái, đè lên vùng chữ (z-10) nhưng
              pointer-events-none để không chặn nút bên dưới. */}
          <div className="mx-auto max-w-lg overflow-hidden rounded-card border border-line bg-card shadow-[0_1px_2px_rgba(23,38,56,0.04),0_16px_32px_-16px_rgba(23,38,56,0.18)] lg:relative lg:z-10 lg:-ml-10 lg:w-[calc(100%+2.5rem)] lg:max-w-none lg:pointer-events-none xl:-ml-20 xl:w-[calc(100%+5rem)]">
            <Image
              src="/images/hero-check-turnitin-v2.png"
              alt="Dịch vụ check Turnitin của HDI — Check AI Turnitin chỉ từ 20K, check đạo văn Turnitin chỉ từ 15K, combo AI và đạo văn Turnitin chỉ từ 35K"
              width={1536}
              height={856}
              priority
              sizes="(min-width: 1280px) 44rem, (min-width: 1024px) 40vw, (min-width: 640px) 32rem, 100vw"
              className="h-auto w-full"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
