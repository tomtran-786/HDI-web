// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Băng thu hồi đơn — phần TRÌNH DUYỆT của luồng bỏ dở thanh toán.
 *
 * Endpoint `/api/thanh-toan/roi-trang` đã có bài riêng ở
 * tests/checkout-reclaim.test.ts. Ở đây chỉ canh đúng một điều: bấm "Đặt lại
 * đơn" thì giỏ hàng trên màn hình phải thấy được cookie mà
 * `restoreCartFromOrder` vừa ghi từ server.
 */

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refreshRouter: vi.fn(),
  refreshCart: vi.fn(),
  restore: vi.fn(),
  fetch: vi.fn(),
  pathname: "/gio-hang",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push, refresh: mocks.refreshRouter }),
}));
vi.mock("@/app/actions/checkout", () => ({ restoreCartFromOrder: mocks.restore }));
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({
    ids: [],
    count: 0,
    full: false,
    has: () => false,
    add: () => undefined,
    remove: () => undefined,
    clear: () => undefined,
    refresh: mocks.refreshCart,
    openCart: () => undefined,
  }),
}));

import { CheckoutReclaim } from "@/components/checkout-reclaim";
import { HANDOFF_COOKIE } from "@/lib/checkout-handoff-cookie";
import { checkoutReclaim } from "@/content/checkout";

let host: HTMLDivElement;
let root: Root;

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function restoreButton() {
  const button = [...host.querySelectorAll("button")].find(
    (item) => item.textContent === checkoutReclaim.restore,
  );
  if (!button) throw new Error("Không tìm thấy nút Đặt lại đơn.");
  return button;
}

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  for (const mock of [mocks.push, mocks.refreshRouter, mocks.refreshCart, mocks.restore, mocks.fetch]) {
    mock.mockReset();
  }
  mocks.pathname = "/gio-hang";
  document.cookie = `${HANDOFF_COOKIE}=order:100039; path=/`;
  mocks.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ huy: true, code: 100_039, orderId: "order-1" }),
  });
  mocks.restore.mockResolvedValue({ ok: true, count: 2 });
  vi.stubGlobal("fetch", mocks.fetch);

  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<CheckoutReclaim />));
  await flush();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  document.cookie = `${HANDOFF_COOKIE}=; path=/; max-age=0`;
});

describe("băng thu hồi đơn", () => {
  it("hiện băng khi có dấu bàn giao và đơn vừa bị thu hồi", () => {
    expect(host.textContent).toContain(checkoutReclaim.body);
  });

  /**
   * Đường đi phổ biến nhất tới cái nút này là bấm Back từ PayOS về ĐÚNG
   * `/gio-hang` — nơi `router.push("/gio-hang")` không đổi `pathname`, nên
   * effect theo `pathname` của `CartProvider` không chạy và cookie giỏ vừa được
   * server ghi không bao giờ được đọc lại. Giỏ hàng đứng nguyên như chưa bấm gì.
   */
  it("bấm Đặt lại đơn thì bắt giỏ hàng đọc lại cookie, không chỉ điều hướng", async () => {
    await act(async () => restoreButton().click());
    await flush();

    expect(mocks.restore).toHaveBeenCalledWith("order-1");
    expect(mocks.refreshCart).toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith("/gio-hang");
  });

  it("khôi phục thất bại thì không điều hướng và không đụng giỏ hàng", async () => {
    mocks.restore.mockResolvedValue({ ok: false });

    await act(async () => restoreButton().click());
    await flush();

    expect(mocks.refreshCart).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
