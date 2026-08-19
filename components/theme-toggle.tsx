"use client";

import { IconMoon, IconSun } from "./ui/icons";

/**
 * The `.dark` class is applied before paint by the bootstrap script in
 * layout.tsx, so which icon to show is a pure CSS question — no state, and
 * nothing to reconcile at hydration.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("hdi-theme", next ? "dark" : "light");
    } catch {
      // private mode — the choice just won't persist
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Đổi giao diện sáng / tối"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-muted transition hover:border-primary hover:text-primary ${className}`}
    >
      <IconMoon className="dark:hidden" />
      <IconSun className="hidden dark:block" />
    </button>
  );
}
