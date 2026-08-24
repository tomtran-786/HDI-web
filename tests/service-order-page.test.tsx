import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentSession: vi.fn(),
  findServiceOrder: vi.fn(),
}));

vi.mock("@/lib/current-session", () => ({
  currentSession: mocks.currentSession,
}));
vi.mock("@/lib/service-orders", async () => {
  const real = await vi.importActual<typeof import("@/lib/service-orders")>(
    "@/lib/service-orders",
  );
  return { ...real, findServiceOrder: mocks.findServiceOrder };
});
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not-found");
  },
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/components/payment-poll", () => ({
  PaymentPoll: () => <p>PAYMENT_POLL_SENTINEL</p>,
}));

import ServiceOrderResultPage from "@/app/kiem-tra-ai-dao-van/ket-qua/[ref]/page";

const ref = "a".repeat(32);

function order(expiresAt: Date) {
  return {
    code: 123456,
    kind: "combo",
    tier: "up_to_1000",
    wordCount: 800,
    amountVnd: 50_000,
    status: "pending",
    expiresAt,
    checkoutUrl: "https://pay.payos.vn/example",
  };
}

describe("trang kết quả đơn dịch vụ", () => {
  beforeEach(() => {
    mocks.currentSession.mockReset();
    mocks.findServiceOrder.mockReset();
    mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("không poll một đơn pending đã quá hạn", async () => {
    mocks.findServiceOrder.mockResolvedValue(
      order(new Date(Date.now() - 60_000)),
    );

    const html = renderToStaticMarkup(
      await ServiceOrderResultPage({
        params: Promise.resolve({ ref }),
        searchParams: Promise.resolve({}),
      } as never),
    );

    expect(html).toContain("Đơn này đã đóng");
    expect(html).not.toContain("PAYMENT_POLL_SENTINEL");
    expect(html).not.toContain("Mở lại trang thanh toán");
  });

  it("chỉ poll khi đơn pending vẫn còn hạn và người dùng không bấm hủy", async () => {
    mocks.findServiceOrder.mockResolvedValue(
      order(new Date(Date.now() + 60_000)),
    );

    const html = renderToStaticMarkup(
      await ServiceOrderResultPage({
        params: Promise.resolve({ ref }),
        searchParams: Promise.resolve({}),
      } as never),
    );

    expect(html).toContain("Đơn đã tạo, đang chờ thanh toán");
    expect(html).toContain("PAYMENT_POLL_SENTINEL");
  });
});
