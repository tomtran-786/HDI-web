import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { paymentCancelPage } from "@/content/checkout";

class NotFoundSignal extends Error {}
class RedirectSignal extends Error {}

const mocks = vi.hoisted(() => ({
  currentSession: vi.fn(),
  orderFindFirst: vi.fn(),
  cancelOrder: vi.fn(),
  allowUserAction: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/current-session", () => ({ currentSession: mocks.currentSession }));
vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findFirst: mocks.orderFindFirst } },
}));
vi.mock("@/lib/orders", () => ({ cancelOrder: mocks.cancelOrder }));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));
// Nút xác nhận là client component và kéo theo cả server action `cancelMyOrder`
// (tức NextAuth và Prisma thật). Bài này kiểm QUYẾT ĐỊNH của trang, nên chỉ cần
// biết nút có được render hay không.
vi.mock("@/app/tai-khoan/don-hang/[code]/cancel", () => ({
  CancelOrder: ({ orderId }: { orderId: string }) => (
    <button type="button" data-cancel-order={orderId}>
      Hủy đơn
    </button>
  ),
}));

import PaymentCancelPage from "@/app/thanh-toan/huy/page";

const LINK_ID = "124c33293c43417ab7879e14c8d9eb18";
const USER_ID = "user-1";

const pendingOrder = {
  id: "order-1",
  code: 100001,
  status: "pending",
  providerRef: LINK_ID,
};

/** Trang là async Server Component: await ra phần tử rồi mới render tĩnh. */
async function html(searchParams: Record<string, string>) {
  return renderToStaticMarkup(
    await PaymentCancelPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

beforeEach(() => {
  mocks.notFound.mockImplementation(() => {
    throw new NotFoundSignal();
  });
  mocks.redirect.mockImplementation((path: string) => {
    throw new RedirectSignal(path);
  });
  mocks.currentSession.mockResolvedValue({ user: { id: USER_ID } });
  mocks.orderFindFirst.mockResolvedValue(pendingOrder);
  mocks.allowUserAction.mockResolvedValue(true);
  mocks.cancelOrder.mockResolvedValue({ cancelled: true, released: 1 });
});

describe("trang PayOS trả về khi hủy", () => {
  it("tự trả chỗ ngay trong một lần tải khi paymentLinkId khớp", async () => {
    const markup = await html({
      orderCode: "100001",
      id: LINK_ID,
      cancel: "true",
      status: "CANCELLED",
    });

    expect(mocks.cancelOrder).toHaveBeenCalledWith("order-1", { userId: USER_ID });
    expect(markup).toContain(paymentCancelPage.released.title);
    // Nút xác nhận sau khi đã hủy là một nút chết.
    expect(markup).not.toContain("data-cancel-order");
  });

  /**
   * `Order.code` là số tự tăng nên đoán được. Nếu thiếu `id` mà trang vẫn hủy,
   * một thẻ `<img src="…/thanh-toan/huy?orderCode=100123">` nhúng ở bất kỳ đâu
   * sẽ hủy đơn của người đang mở tab thanh toán. Hai bài dưới đây là bài kiểm
   * CSRF, không phải bài kiểm giao diện.
   */
  it("không hủy gì khi thiếu paymentLinkId", async () => {
    const markup = await html({ orderCode: "100001" });

    expect(mocks.cancelOrder).not.toHaveBeenCalled();
    expect(markup).toContain(paymentCancelPage.confirm.title);
    expect(markup).toContain('data-cancel-order="order-1"');
  });

  it("không hủy gì khi paymentLinkId lệch providerRef", async () => {
    const markup = await html({ orderCode: "100001", id: "sai-hoan-toan" });

    expect(mocks.cancelOrder).not.toHaveBeenCalled();
    expect(markup).toContain(paymentCancelPage.confirm.title);
    expect(markup).toContain('data-cancel-order="order-1"');
  });

  it("không gọi PayOS khi đơn không còn chờ thanh toán", async () => {
    mocks.orderFindFirst.mockResolvedValueOnce({ ...pendingOrder, status: "paid" });

    const markup = await html({ orderCode: "100001", id: LINK_ID });

    expect(mocks.cancelOrder).not.toHaveBeenCalled();
    expect(markup).not.toContain("data-cancel-order");
  });

  it("giữ nút xác nhận và nói rõ lý do khi PayOS đang xử lý tiền", async () => {
    mocks.cancelOrder.mockResolvedValueOnce({
      cancelled: false,
      released: 0,
      reason: "payment_in_progress",
    });

    const markup = await html({ orderCode: "100001", id: LINK_ID });

    expect(markup).toContain(paymentCancelPage.busy.payment_in_progress);
    expect(markup).toContain('data-cancel-order="order-1"');
    expect(markup).not.toContain(paymentCancelPage.released.title);
  });

  it("giữ nút xác nhận khi không liên hệ được PayOS", async () => {
    mocks.cancelOrder.mockResolvedValueOnce({
      cancelled: false,
      released: 0,
      reason: "gateway_unavailable",
    });

    const markup = await html({ orderCode: "100001", id: LINK_ID });

    expect(markup).toContain(paymentCancelPage.busy.gateway_unavailable);
    expect(markup).toContain('data-cancel-order="order-1"');
  });

  it("báo đơn đã đóng khi một đường khác vừa đóng nó trước", async () => {
    mocks.cancelOrder.mockResolvedValueOnce({
      cancelled: false,
      released: 0,
      reason: "not_pending",
    });

    const markup = await html({ orderCode: "100001", id: LINK_ID });

    expect(markup).toContain(paymentCancelPage.closed.title);
    expect(markup).not.toContain("data-cancel-order");
  });

  it("không hủy khi vượt hạn mức thao tác", async () => {
    mocks.allowUserAction.mockResolvedValueOnce(false);

    const markup = await html({ orderCode: "100001", id: LINK_ID });

    expect(mocks.cancelOrder).not.toHaveBeenCalled();
    expect(markup).toContain(paymentCancelPage.confirm.title);
  });

  /**
   * `id` là thứ duy nhất cho phép trang tự hủy. Rụng nó ở bước đăng nhập nghĩa
   * là người chưa đăng nhập vĩnh viễn rơi vào nhánh xác nhận thủ công.
   */
  it("chở nguyên query string qua bước đăng nhập", async () => {
    mocks.currentSession.mockResolvedValueOnce(null);

    await expect(
      html({ orderCode: "100001", id: LINK_ID, cancel: "true" }),
    ).rejects.toBeInstanceOf(RedirectSignal);

    const target = mocks.redirect.mock.calls[0][0] as string;
    const tiep = decodeURIComponent(target.split("tiep=")[1]);
    expect(tiep).toContain("orderCode=100001");
    expect(tiep).toContain(`id=${LINK_ID}`);
    expect(tiep).toContain("cancel=true");
    expect(mocks.orderFindFirst).not.toHaveBeenCalled();
  });

  it("trả 404 cho mã đơn không phải số nguyên trước khi truy vấn", async () => {
    await expect(html({ orderCode: "abc" })).rejects.toBeInstanceOf(NotFoundSignal);
    expect(mocks.orderFindFirst).not.toHaveBeenCalled();
  });

  it("chỉ tìm đơn của chính người đang đăng nhập", async () => {
    mocks.orderFindFirst.mockResolvedValueOnce(null);

    await expect(
      html({ orderCode: "100001", id: LINK_ID }),
    ).rejects.toBeInstanceOf(NotFoundSignal);
    expect(mocks.orderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 100001, userId: USER_ID },
      }),
    );
  });
});
