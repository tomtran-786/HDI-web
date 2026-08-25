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

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2.5 font-bold tracking-tight">
            <Image
              src="/images/logo-mark.png"
              alt=""
              width={256}
              height={256}
              className="h-9 w-9 rounded-lg"
            />
            <span className="flex items-baseline gap-2">
              <span className="text-lg text-primary">{site.short}</span>
              <span className="text-sm text-fg-muted">Research Center</span>
            </span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
            {site.blurb}
          </p>
          <p className="mt-4 text-sm text-fg-subtle">
            {site.lead.role}: {site.lead.name}
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
        <div className="shell flex flex-col gap-2 py-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p>
            <a
              className="hover:text-primary"
              href={composeEmailHref()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contact.email}
            </a>
            <span className="px-2">·</span>
            <a className="hover:text-primary" href={contact.phoneHref}>
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
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
        {title}
      </p>
      <ul className="space-y-2.5">
        {items.map((item) => {
          const offsite = external ||
            (item.href?.startsWith("http") ?? false);
          const style = "text-sm text-fg-muted transition hover:text-primary";
          const label = (
            <>
              {item.label}
              {offsite && <span aria-hidden> ↗</span>}
            </>
          );
          return (
            <li key={item.label}>
              {item.cta ? (
                <CtaLink source={item.cta} target="tu-van" className={style}>
                  {label}
                </CtaLink>
              ) : (
                <a
                  href={item.href}
                  download={"download" in item && item.download ? true : undefined}
                  {...(offsite
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={style}
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
