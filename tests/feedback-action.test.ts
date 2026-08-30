import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  allowUserAction: vi.fn(),
  create: vi.fn(),
  sendReceived: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("@/lib/email", () => ({ sendFeedbackReceivedEmail: mocks.sendReceived }));
vi.mock("@/lib/prisma", () => ({
  prisma: { feedback: { create: mocks.create } },
}));

import { submitFeedback } from "@/app/actions/feedback";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = {
  kind: "bug",
  title: "  Nút không phản hồi  ",
  body: "  Bấm **Gửi** nhưng không có gì xảy ra.  ",
  pageUrl: "/khoa-hoc",
};

describe("gửi feedback", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.allowUserAction.mockResolvedValue(true);
    mocks.create.mockResolvedValue({
      user: { name: "Lan", email: "lan@example.com" },
    });
    mocks.sendReceived.mockResolvedValue({ sent: true });
  });

  it("chặn người chưa đăng nhập trước khi validate, throttle hoặc ghi", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await submitFeedback({}, form(valid));

    expect(result.error).toContain("đăng nhập");
    expect(mocks.allowUserAction).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("chặn khi quá throttle trước khi ghi database", async () => {
    mocks.allowUserAction.mockResolvedValue(false);

    const result = await submitFeedback({}, form(valid));

    expect(result.error).toContain("quá nhiều lần");
    expect(mocks.allowUserAction).toHaveBeenCalledWith("feedback", "user-1", 10);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("ghi dữ liệu đã chuẩn hóa và gửi mail tới email đọc từ database", async () => {
    const result = await submitFeedback({}, form(valid));

    expect(result).toEqual({ saved: true });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        kind: "bug",
        title: "Nút không phản hồi",
        body: "Bấm **Gửi** nhưng không có gì xảy ra.",
        pageUrl: "/khoa-hoc",
      },
      select: { user: { select: { name: true, email: true } } },
    });
    expect(mocks.sendReceived).toHaveBeenCalledWith({
      to: "lan@example.com",
      name: "Lan",
      kind: "bug",
      title: "Nút không phản hồi",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/quan-tri");
  });

  it("mail hỏng không làm gãy feedback đã ghi", async () => {
    mocks.sendReceived.mockRejectedValue(new Error("resend unavailable"));
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(submitFeedback({}, form(valid))).resolves.toEqual({ saved: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/quan-tri");

    quiet.mockRestore();
  });

  it("ghi log khi Resend từ chối thư cảm ơn nhưng vẫn lưu feedback", async () => {
    mocks.sendReceived.mockResolvedValue({ sent: false, error: "sandbox_sender" });
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(submitFeedback({}, form(valid))).resolves.toEqual({ saved: true });
    expect(quiet).toHaveBeenCalledWith(
      "[feedback] Thư cảm ơn bị từ chối:",
      "sandbox_sender",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/quan-tri");

    quiet.mockRestore();
  });
});
