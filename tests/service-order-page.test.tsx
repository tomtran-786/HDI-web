import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentSession: vi.fn(),
  findServiceOrder: vi.fn(),
  cancelServiceOrder: vi.fn(),
  syncPayosServiceOrderStatus: vi.fn(),
  allowUserAction: vi.fn(),
}));

vi.mock("@/lib/current-session", () => ({
  currentSession: mocks.currentSession,
}));
vi.mock("@/lib/service-orders", async () => {
  const real = await vi.importActual<typeof import("@/lib/service-orders")>(
    "@/lib/service-orders",
  );
  return {
    ...real,
    findServiceOrder: mocks.findServiceOrder,
    cancelServiceOrder: mocks.cancelServiceOrder,
    syncPayosServiceOrderStatus: mocks.syncPayosServiceOrderStatus,
  };
});
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
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
// Component hủy kéo theo cả `@/lib/auth` qua server action của nó; trang này
// chỉ cần biết nút đó có được vẽ ra hay không.
vi.mock("@/app/kiem-tra-ai-dao-van/ket-qua/[ref]/cancel", () => ({
  CancelServiceOrder: () => <p>CANCEL_SENTINEL</p>,
}));

import ServiceOrderResultPage from "@/app/kiem-tra-ai-dao-van/ket-qua/[ref]/page";

const ref = "a".repeat(32);

const providerRef = "b".repeat(32);

function order(expiresAt: Date, overrides: Record<string, unknown> = {}) {
  return {
    id: "svc-1",
    providerRef,
    code: 123456,
    kind: "combo",
    tier: "up_to_1000",
    wordCount: 800,
    amountVnd: 50_000,
    status: "pending",
    expiresAt,
    checkoutUrl: "https://pay.payos.vn/example",
    ...overrides,
  };
}

describe("trang kết quả đơn dịch vụ", () => {
  beforeEach(() => {
    mocks.currentSession.mockReset();
    mocks.findServiceOrder.mockReset();
    mocks.cancelServiceOrder.mockReset();
    mocks.syncPayosServiceOrderStatus.mockReset();
    mocks.allowUserAction.mockReset();
    mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.allowUserAction.mockResolvedValue(true);
    mocks.syncPayosServiceOrderStatus.mockResolvedValue({ closed: false });
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

  it("hủy đơn thật khi PayOS trả về kèm paymentLinkId khớp", async () => {
    mocks.findServiceOrder.mockResolvedValue(order(new Date(Date.now() + 60_000)));
    mocks.cancelServiceOrder.mockResolvedValue({ cancelled: true });

    const html = renderToStaticMarkup(
      await ServiceOrderResultPage({
        params: Promise.resolve({ ref }),
        searchParams: Promise.resolve({ huy: "1", id: providerRef }),
      } as never),
    );

    expect(mocks.cancelServiceOrder).toHaveBeenCalledWith("svc-1", {
      userId: "user-1",
    });
    expect(html).toContain("Đã hủy đơn dịch vụ");
    // Đơn đã đóng thì không còn gì để poll và không còn gì để hủy nữa.
    expect(html).not.toContain("PAYMENT_POLL_SENTINEL");
    expect(html).not.toContain("CANCEL_SENTINEL");
  });

  it("không hủy gì khi `huy=1` không kèm paymentLinkId khớp", async () => {
    mocks.findServiceOrder.mockResolvedValue(order(new Date(Date.now() + 60_000)));

    const html = renderToStaticMarkup(
      await ServiceOrderResultPage({
        params: Promise.resolve({ ref }),
        searchParams: Promise.resolve({ huy: "1", id: "c".repeat(32) }),
      } as never),
    );

    // `?huy=1` một mình ai cũng gõ ra được, nên nó không bao giờ được tự hủy.
    expect(mocks.cancelServiceOrder).not.toHaveBeenCalled();
    expect(html).toContain("Bạn đã rời trang thanh toán");
    // …nhưng vẫn HỎI PayOS, vì đọc trạng thái không phải là một tác dụng phụ.
    expect(mocks.syncPayosServiceOrderStatus).toHaveBeenCalledWith("svc-1", {
      userId: "user-1",
    });
    expect(html).toContain("CANCEL_SENTINEL");
  });

  it("đóng đơn khi PayOS cho biết link đã chết, dù không có tham số nào", async () => {
    mocks.findServiceOrder.mockResolvedValue(order(new Date(Date.now() + 60_000)));
    mocks.syncPayosServiceOrderStatus.mockResolvedValue({
      closed: true,
      as: "cancelled",
    });

    const html = renderToStaticMarkup(
      await ServiceOrderResultPage({
        params: Promise.resolve({ ref }),
        searchParams: Promise.resolve({}),
      } as never),
    );

    expect(html).toContain("Đã hủy đơn dịch vụ");
    expect(html).not.toContain("PAYMENT_POLL_SENTINEL");
  });

  it("không hủy khi vượt hạn mức, và không im lặng bỏ qua nút hủy thủ công", async () => {
    mocks.findServiceOrder.mockResolvedValue(order(new Date(Date.now() + 60_000)));
    mocks.allowUserAction.mockResolvedValue(false);

    const html = renderToStaticMarkup(
      await ServiceOrderResultPage({
        params: Promise.resolve({ ref }),
        searchParams: Promise.resolve({ huy: "1", id: providerRef }),
      } as never),
    );

    expect(mocks.cancelServiceOrder).not.toHaveBeenCalled();
    expect(html).toContain("CANCEL_SENTINEL");
  });
});
