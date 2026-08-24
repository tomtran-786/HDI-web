import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import {
  sendEmail,
  sendFeedbackReceivedEmail,
  sendFeedbackResolvedEmail,
} from "@/lib/email";

describe("Resend boundary", () => {
  beforeEach(() => {
    send.mockReset();
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "HDI <no-reply@hdi.test>";
    send.mockResolvedValue({ data: { id: "email-1" }, error: null });
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

  it("gửi thư xác nhận feedback, escape tiêu đề và không in CTA/cảnh báo", async () => {
    await sendFeedbackReceivedEmail({
      to: "student@example.com",
      name: "Lan",
      kind: "bug",
      title: '<script>alert("x")</script>',
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@example.com",
        subject: "Đã nhận feedback của bạn — HDI Research Center",
        html: expect.stringContaining("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"),
      }),
    );
    const html = send.mock.calls[0][0].html as string;
    expect(html).toContain("Báo lỗi");
    expect(html).not.toContain("Nếu bạn không thực hiện yêu cầu này");
    expect(html).not.toContain("<a href=");
  });

  it("gửi thư báo feedback đã xử lý với đúng loại và tiêu đề", async () => {
    await sendFeedbackResolvedEmail({
      to: "student@example.com",
      name: null,
      kind: "idea",
      title: "Thêm bộ lọc",
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Feedback của bạn đã được xử lý — HDI Research Center",
        html: expect.stringContaining("Thêm bộ lọc"),
      }),
    );
    expect(send.mock.calls[0][0].html).toContain("Góp ý");
  });
});
