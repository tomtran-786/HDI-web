import Image from "next/image";
import { footerNav } from "@/content/navigation";
import { composeEmailHref, contact, links, site } from "@/content/site";
import type { CtaSource } from "@/lib/analytics";
import { CtaLink } from "./ui/cta-link";

const elsewhere = [
  { label: "Trang cũ (Google Sites)", href: links.legacySite },
  { label: "Facebook", href: links.fanpage },
  { label: "Linktree", href: links.linktree },
  { label: "TikTok", href: links.tiktok },
];

const documents = [
  { label: "Tải CV", href: links.cv, download: true },
  { label: "Teaching statement", href: links.teachingStatement },
  // `cta` instead of `href`: CtaLink resolves the URL and reports the click.
  { label: "Tư vấn miễn phí", cta: "footer" as CtaSource },
];

// Shared link treatment — explicit `transition-colors` (not `transition`), a
// designed focus ring, and a hover colour, so every footer link has real
// hover/focus states rather than browser defaults.
const linkClass =
  "rounded-sm text-sm text-fg-muted transition-colors hover:text-primary " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="shell grid gap-x-8 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Image
            src="/images/logo.webp"
            alt={`${site.name} logo`}
            width={560}
            height={876}
            className="h-auto w-28 rounded-xl"
          />
          <p className="mt-5 text-sm leading-relaxed text-fg-muted">
            {site.blurb}
          </p>
          <p className="mt-4 text-sm text-fg-subtle">
            {site.lead.role}:{" "}
            <span className="text-fg-muted">{site.lead.name}</span>
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
        <FooterColumn title="Kênh khác" items={elsewhere} external />
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-5 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="flex items-center gap-2.5">
            <a
              className={linkClass}
              href={composeEmailHref()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contact.email}
            </a>
            <span aria-hidden className="text-fg-subtle/40">
              ·
            </span>
            <a className={linkClass} href={contact.phoneHref}>
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
}: {
  title: string;
  items: readonly { label: string; href?: string; cta?: CtaSource }[];
  external?: boolean;
}) {
  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-fg-muted">
        <span aria-hidden className="h-px w-4 shrink-0 bg-primary" />
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const offsite = external ||
            (item.href?.startsWith("http") ?? false);
          const label = (
            <>
              {item.label}
              {offsite && <span aria-hidden> ↗</span>}
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
    </div>
  );
}
