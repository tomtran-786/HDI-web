/** Inline stroke icons, sized by the `size` prop and coloured by currentColor. */
type IconProps = { className?: string; size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconUser({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconUsers({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconJournal({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h7M9 11h5" />
    </svg>
  );
}

export function IconRevise({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function IconMail({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

export function IconPhone({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

export function IconMessage({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-3.9-.8L3 20.5l1.4-4.1A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
    </svg>
  );
}

export function IconDownload({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

export function IconArrow({ className, size = 20 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function IconSun({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function IconMoon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function IconCheck({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

export function IconMenu({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function IconClose({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export const programIcons = {
  user: IconUser,
  users: IconUsers,
  journal: IconJournal,
  revise: IconRevise,
};
