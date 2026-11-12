import Image from "next/image";
import { about } from "@/content/about";
import { site } from "@/content/site";
import { stats, type Stat } from "@/content/stats";
import type { OpenCourse } from "@/lib/open-courses";
import { Programme } from "../programme";
import { CtaLink } from "../ui/cta-link";
import { CredibilityMarquee } from "./credibility-marquee";

/**
 * Khung đầu trang chủ theo hướng "chương trình hội nghị"
 * (.impeccable/surfaces/app-page-tsx.md): tiêu đề, một câu giới thiệu, rồi bảng
 * chương trình — các khóa đang mở là phiên chính có nút Đăng ký trên từng
 * dòng, kiểm tra AI & đạo văn là phiên song song. Cố vấn học thuật xuất hiện
 * trên thẻ đeo diễn giả ở cột phải; trên mobile thẻ thu thành một hàng ngang
 * đứng trước bảng.
 *
 * Hành động chính của trang là mua khóa (PRODUCT.md), nên nút chính nằm ngay
 * trên dòng khóa; tư vấn là liên kết phụ.
 *
 * `open` do trang đọc sẵn (lib/open-courses.ts) để Hero vẫn là component đồng
 * bộ, render được trong test.
 */
export function Hero({ open }: { open: OpenCourse[] }) {
  return (
    <section id="top" className="bg-bg">
      <div className="shell grid gap-x-16 pt-10 pb-12 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:pt-14 lg:pb-16">
        <div className="lg:col-start-1 lg:row-start-1">
          <h1 className="max-w-[18ch] text-[2.5rem] leading-[1.06] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
            {site.tagline}
          </h1>
          <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-fg-muted">
            {site.name} đồng hành cùng bạn từ khâu xác định câu hỏi nghiên cứu đến
            lúc gửi bài và trả lời phản biện tại các tạp chí quốc tế — qua các lộ
            trình đồng hành nghiên cứu, khóa đào tạo và dịch vụ hỗ trợ bản thảo.
          </p>
        </div>

        <SpeakerBadge />

        <div className="lg:col-start-1 lg:row-start-2">
          <Programme open={open} />
          <p className="mt-6 text-[0.9375rem] text-fg-muted">
            Chưa chắc khóa nào hợp với đề tài của bạn?{" "}
            <CtaLink
              source="hero"
              target="tu-van"
              className="font-semibold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              Đăng ký tư vấn miễn phí
            </CtaLink>
          </p>
        </div>
      </div>
      {/* Dải chạy nằm trong chính <section id="top"> để thứ tự các section
          của trang chủ không đổi. */}
      <CredibilityMarquee />
    </section>
  );
}

/** Học viên đã đồng hành — số chủ dự án xác nhận (PRODUCT.md, Evidence on Hand). */
const LEARNERS = "500+";

function formatStat({ to, prefix = "", suffix = "", grouped }: Stat) {
  const value = grouped ? new Intl.NumberFormat("vi-VN").format(to) : String(to);
  return `${prefix}${value}${suffix}`;
}

/**
 * Thẻ đeo diễn giả treo trên dây navy. Thông tin thật của cố vấn và các số
 * liệu đếm từ hồ sơ công bố (content/stats.ts) nằm ngay dưới thẻ.
 *
 * Chuyển động đặc trưng duy nhất của trang: thẻ lắc nhẹ một lần khi tải
 * (`.badge-settle` trong globals.css), tắt hẳn khi người dùng giảm chuyển động.
 */
function SpeakerBadge() {
  const { advisor } = about;
  return (
    <aside
      aria-label="Cố vấn học thuật"
      className="mt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0"
    >
      <div className="relative lg:-mt-14 lg:pt-14">
        {/* Dây đeo: chỉ có trên màn rộng, chạy từ mép trên của hero xuống thẻ. */}
        <span
          aria-hidden
          className="absolute top-0 left-1/2 hidden h-16 w-5 -translate-x-1/2 bg-primary lg:block"
        />
        <div className="badge-settle relative border-2 border-rule bg-card lg:origin-top">
          <p className="hidden bg-primary px-4 py-2.5 font-cond text-[0.8125rem] font-bold tracking-[0.12em] text-primary-fg uppercase lg:block">
            {site.name}
          </p>
          <div className="flex items-center gap-4 p-3 lg:block lg:p-0">
            <Image
              src={advisor.portrait.src}
              alt={advisor.portrait.alt}
              width={960}
              height={1280}
              preload
              sizes="(min-width: 1024px) 17.5rem, 5rem"
              className="h-24 w-20 shrink-0 object-cover object-[center_30%] lg:h-72 lg:w-full"
            />
            <div className="min-w-0 lg:px-4 lg:pt-4 lg:pb-4">
              <p className="text-xl leading-tight font-bold lg:text-2xl">{advisor.name}</p>
              <p className="mt-1 text-sm text-fg-muted">{advisor.credential}</p>
              <p className="mt-2 inline-block bg-accent px-2 py-1 font-cond text-[0.75rem] font-bold tracking-[0.1em] text-primary-fg uppercase lg:hidden">
                {advisor.label}
              </p>
            </div>
          </div>
          <p className="hidden bg-accent px-4 py-2.5 font-cond text-[0.8125rem] font-bold tracking-[0.12em] text-primary-fg uppercase lg:block">
            {advisor.label}
          </p>
        </div>
      </div>

      {/* Mobile chỉ giữ dòng "500+ học viên" — con số thật duy nhất nói về người
          học (PRODUCT.md); bốn số liệu học thuật chỉ hiện từ lg để giữ trang ngắn. */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-3 lg:mt-6 lg:pt-5">
        {stats.map((stat) => (
          <div key={stat.label} className="hidden lg:block">
            <dt className="text-[0.8125rem] leading-snug text-fg-muted">{stat.label}</dt>
            <dd className="font-cond text-2xl leading-tight font-bold">{formatStat(stat)}</dd>
          </div>
        ))}
        <div className="col-span-2">
          <dt className="text-[0.8125rem] leading-snug text-fg-muted">
            Học viên &amp; nghiên cứu sinh đã đồng hành
          </dt>
          <dd className="font-cond text-2xl leading-tight font-bold">{LEARNERS}</dd>
        </div>
      </dl>
    </aside>
  );
}
