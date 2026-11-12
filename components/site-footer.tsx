import Image from "next/image";
import { footerNav } from "@/content/navigation";
import { composeEmailHref, contact, links, site } from "@/content/site";
import type { CtaSource } from "@/lib/analytics";
import { FooterCtaCard } from "./footer-cta-card";
import { CtaLink } from "./ui/cta-link";
import { IconFacebook, IconLinktree, IconTiktok } from "./ui/icons";

const elsewhere = [
  { label: "Trang cũ (Google Sites)", href: links.legacySite },
  { label: "Facebook", href: links.fanpage },
  { label: "Linktree", href: links.linktree },
  { label: "TikTok", href: links.tiktok },
];

/** Hàng icon tròn ở cột "Kênh khác"; danh sách chữ bên trên vẫn giữ đủ link. */
const socials = [
  { label: "Facebook", href: links.fanpage, icon: IconFacebook },
  { label: "TikTok", href: links.tiktok, icon: IconTiktok },
  { label: "Linktree", href: links.linktree, icon: IconLinktree },
];

const documents = [
  { label: "Tải CV", href: links.cv, download: true },
  { label: "Teaching statement", href: links.teachingStatement },
  // `cta` instead of `href`: CtaLink resolves the URL and reports the click.
  { label: "Tư vấn miễn phí", cta: "footer" as CtaSource },
];

// Footer là band navy ở cả hai theme, nên chữ/ring dùng màu cố định trên nền
// tối thay vì token chữ của trang. `--band` làm màu offset của ring focus.
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-on-band " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-(color:--band)";

// Shared link treatment — explicit `transition-colors` (not `transition`), a
// designed focus ring, and a hover colour, so every footer link has real
// hover/focus states rather than browser defaults.
const linkClass =
  `rounded-xs text-sm text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline ${focusRing}`;

export function SiteFooter() {
  return (
    <footer className="band relative">
      <FooterCtaCard />
      <div className="shell relative grid gap-x-8 gap-y-10 border-t border-white/15 pb-12 pt-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 font-bold tracking-tight">
            <Image
              src="/images/logo-mark.png"
              alt={`${site.name} logo`}
              width={256}
              height={256}
              className="h-11 w-11 rounded-sm"
            />
            <span className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white">{site.short}</span>
              <span className="text-sm text-white/75">Research Center</span>
            </span>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-white/75">
            {site.blurb}
          </p>
          <p className="mt-4 text-sm text-white/60">
            {site.lead.role}:{" "}
            <span className="text-white/85">{site.lead.name}</span>
            <br />
            {site.lead.credential}
          </p>
        </div>

        <FooterColumn
          title="Khám phá"
          items={[
            ...footerNav,
            { label: "Đăng nhập", href: "/dang-nhap" },
          ]}
        />
        <FooterColumn title="Tài liệu" items={documents} />
        <FooterColumn title="Kênh khác" items={elsewhere} external>
          <ul className="mt-5 flex gap-2.5">
            {socials.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xs border border-white/40 text-white transition-colors hover:bg-white hover:text-(--band) ${focusRing}`}
                >
                  <Icon size={16} />
                </a>
              </li>
            ))}
          </ul>
        </FooterColumn>
      </div>

      <div className="relative border-t border-white/15">
        <div className="shell flex flex-col gap-2 py-5 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="flex items-center gap-2.5">
            <a
              className={`${linkClass} text-white/70`}
              href={composeEmailHref()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contact.email}
            </a>
            <span aria-hidden className="text-white/25">
              ·
            </span>
            <a className={`${linkClass} text-white/70`} href={contact.phoneHref}>
              {contact.phone}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
  external = false,
  children,
}: {
  title: string;
  items: readonly { label: string; href?: string; cta?: CtaSource }[];
  external?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-4 text-[0.8125rem] font-bold tracking-[0.08em] text-white/60 uppercase">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const offsite = external ||
            (item.href?.startsWith("http") ?? false);
          const label = (
            <>
              {item.label}
            </>
          );
          return (
            <li key={item.label}>
              {item.cta ? (
                <CtaLink source={item.cta} target="tu-van" className={linkClass}>
                  {label}
                </CtaLink>
              ) : (
                <a
                  href={item.href}
                  download={"download" in item && item.download ? true : undefined}
                  {...(offsite
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={linkClass}
                >
                  {label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {children}
    </div>
  );
}
