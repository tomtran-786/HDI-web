import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { sendEmail } from "@/lib/email";

describe("Resend boundary", () => {
  beforeEach(() => {
    send.mockReset();
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "HDI <no-reply@hdi.test>";
  });

  it("checks Resend's returned error instead of assuming no throw means success", async () => {
    send.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    await expect(
      sendEmail({ to: "student@example.com", subject: "Test", html: "<p>Test</p>" }),
    ).resolves.toEqual({ sent: false, error: "domain not verified" });
  });

  it("reports the provider message id on success", async () => {
    send.mockResolvedValue({ data: { id: "email-1" }, error: null });
    await expect(
      sendEmail({ to: "student@example.com", subject: "Test", html: "<p>Test</p>" }),
    ).resolves.toEqual({ sent: true, id: "email-1" });
  });
});

