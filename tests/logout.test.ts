import { describe, expect, it, vi } from "vitest";

const signOut = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({ signOut }));

import { performClientSignOut } from "@/app/tai-khoan/logout-button";

describe("account logout", () => {
  it("uses Auth.js client sign-out so SessionProvider and the JWT cookie stay in sync", async () => {
    signOut.mockResolvedValue(undefined);

    await performClientSignOut();

    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/" });
  });
});
