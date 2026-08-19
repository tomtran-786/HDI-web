import Image from "next/image";
import { about } from "@/content/about";
import { links, site } from "@/content/site";
import { Reveal } from "../ui/reveal";
import { IconArrow, IconDownload } from "../ui/icons";

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
            lúc gửi bài và trả lời phản biện tại các tạp chí quốc tế. Dẫn dắt chuyên
            môn bởi <strong className="font-semibold text-fg">{site.lead.name}</strong>{" "}
            — {site.lead.credential}.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={links.register}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Đăng ký tư vấn miễn phí
              <IconArrow size={16} />
            </a>
            <a
              href="#chuong-trinh"
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              Xem chương trình
            </a>
            <a
              href={links.cv}
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
            >
              <IconDownload size={16} />
              Tải CV
            </a>
          </div>
        </Reveal>

        <Reveal delay={120} className="justify-self-center lg:justify-self-end">
          <figure className="relative">
            <div
              aria-hidden
              className="absolute -inset-4 rounded-full bg-tint/70 blur-2xl"
            />
            <Image
              src={about.portrait.src}
              alt={about.portrait.alt}
              width={620}
              height={620}
              priority
              className="relative h-56 w-56 rounded-full border-4 border-card object-cover shadow-[0_20px_60px_-24px_rgba(12,73,143,0.6)] sm:h-72 sm:w-72 lg:h-80 lg:w-80"
            />
            <figcaption className="relative mt-5 text-center">
              <p className="font-bold text-fg">{site.lead.name}</p>
              <p className="mt-1 text-sm text-fg-muted">{site.lead.credential}</p>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
