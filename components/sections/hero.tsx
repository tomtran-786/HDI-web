import Image from "next/image";
import { site } from "@/content/site";
import { CtaLink } from "../ui/cta-link";
import { Reveal } from "../ui/reveal";
import { IconArrow } from "../ui/icons";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-bg">
      {/* soft tint wash behind the hero, per the reference design */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_100%_at_70%_0%,var(--tint)_0%,transparent_70%)]"
      />
      <div className="shell relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full bg-tint px-3 py-1.5 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Đang nhận học viên cho khóa mới
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

          <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {site.name} đồng hành cùng bạn từ khâu xác định câu hỏi nghiên cứu đến
            lúc gửi bài và trả lời phản biện tại các tạp chí quốc tế — qua các
            chương trình kèm cặp, khóa đào tạo và dịch vụ hỗ trợ bản thảo.{" "}
            {site.lead.role}:{" "}
            <strong className="font-semibold text-fg">{site.lead.name}</strong> —{" "}
            {site.lead.credential}.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink
              source="hero"
              target="tu-van"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Đăng ký tư vấn miễn phí
              <IconArrow size={16} />
            </CtaLink>
            <a
              href="#chuong-trinh"
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              Xem chương trình
            </a>
          </div>
        </Reveal>

        <Reveal delay={120} className="justify-self-center lg:justify-self-end">
          {/* The centre's logo, not a portrait: the page is about HDI now, and
              the mark carries its own navy so it sits on either theme. */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-full bg-tint/70 blur-2xl"
            />
            <div className="relative rounded-card border border-line bg-tint/50 p-5 shadow-[0_20px_60px_-24px_rgba(12,73,143,0.6)] dark:bg-card sm:p-6">
              <Image
                src="/images/logo.webp"
                alt={site.name}
                width={560}
                height={876}
                priority
                className="h-auto w-48 sm:w-56 lg:w-64"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
