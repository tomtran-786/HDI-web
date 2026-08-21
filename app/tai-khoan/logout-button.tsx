"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { IconLogout } from "@/components/ui/icons";

export function performClientSignOut() {
  return signOut({ redirectTo: "/" });
}

/**
 * Keep sign-out on the client so Auth.js can serialize the cookie deletion,
 * update SessionProvider, and broadcast the change to other tabs. A Server
 * Action raced with SessionProvider's concurrent session refresh in the real
 * browser and the refreshed JWT overwrote the expired cookie.
 */
export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          await performClientSignOut();
        } catch (error) {
          console.error("[auth] Không đăng xuất được:", error);
          setBusy(false);
        }
      }}
      className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"
    >
      <IconLogout size={16} />
      {busy ? "Đang đăng xuất…" : "Đăng xuất"}
    </button>
  );
}
