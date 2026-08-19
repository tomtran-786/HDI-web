import { contact, links, nav, site } from "@/content/site";

const elsewhere = [
  { label: "Trang cũ (Google Sites)", href: links.legacySite },
  { label: "Linktree", href: links.linktree },
  { label: "TikTok", href: links.tiktok },
];

const documents = [
  { label: "Tải CV", href: links.cv },
  { label: "Teaching statement", href: links.teachingStatement },
  { label: "Đăng ký tư vấn", href: links.register },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-baseline gap-2 font-bold tracking-tight">
            <span className="text-lg text-primary">{site.short}</span>
            <span className="text-sm text-fg-muted">Research Center</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
            {site.blurb}
          </p>
          <p className="mt-4 text-sm text-fg-subtle">
            {site.lead.name}
            <br />
            {site.lead.credential}
          </p>
        </div>

        <FooterColumn title="Khám phá" items={nav.map((n) => ({ ...n }))} />
        <FooterColumn title="Tài liệu" items={documents} />
        <FooterColumn title="Kênh khác" items={elsewhere} external />
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p>
            <a className="hover:text-primary" href={`mailto:${contact.email}`}>
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
  items: readonly { label: string; href: string }[];
  external?: boolean;
}) {
  return (
    <div>
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
        {title}
      </p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              {...(external || item.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-sm text-fg-muted transition hover:text-primary"
            >
              {item.label}
              {(external || item.href.startsWith("http")) && (
                <span aria-hidden> ↗</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
