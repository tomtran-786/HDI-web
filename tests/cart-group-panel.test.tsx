// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const store = {
    ids: [] as string[],
    listeners: new Set<() => void>(),
    emit() {
      for (const listener of store.listeners) listener();
    },
    subscribe(listener: () => void) {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    getIds: () => store.ids,
    setIds(next: string[]) {
      store.ids = next;
      store.emit();
    },
  };
  return {
    fetch: vi.fn(),
    push: vi.fn(),
    store,
    // Module-stable identities: the cart page threads `remove` through a
    // useCallback dependency list, so a fresh function each render loops.
    add: (id: string) => {
      if (!store.ids.includes(id)) store.setIds([...store.ids, id]);
    },
    remove: (id: string) => store.setIds(store.ids.filter((value) => value !== id)),
    clear: () => store.setIds([]),
  };
});

vi.mock("next/navigation", () => {
  const router = { push: mocks.push };
  const params = new URLSearchParams();
  return { useRouter: () => router, useSearchParams: () => params };
});
vi.mock("@/app/actions/checkout", () => ({ checkout: vi.fn() }));
vi.mock("@/lib/analytics", () => ({
  trackCartAdd: vi.fn(),
  trackCartRemove: vi.fn(),
  trackCheckout: vi.fn(),
}));
// The cart page reads its selection from CartProvider's context.
vi.mock("@/components/cart-provider", async () => {
  const react = await import("react");
  return {
    useCart: () => {
      const ids = react.useSyncExternalStore(
        mocks.store.subscribe,
        mocks.store.getIds,
        mocks.store.getIds,
      );
      return {
        ids,
        count: ids.length,
        full: false,
        has: (id: string) => ids.includes(id),
        add: mocks.add,
        remove: mocks.remove,
        clear: mocks.clear,
        openCart: () => undefined,
      };
    },
  };
});

import { CartClient } from "@/app/gio-hang/cart-client";
import { groupPanel } from "@/content/checkout";

const groupCourse = {
  id: "course-group",
  code: "TIEULUAN",
  slug: "training-tieu-luan-nckh-kltn",
  title: "Tiểu luận nghiên cứu khoa học",
  priceVnd: 300_000,
  groupEligible: true,
  groupPriceVnd: 250_000,
  availability: "buyable" as const,
  seatsLeft: 10,
};

let host: HTMLDivElement;
let root: Root;

function emailInput() {
  const input = host.querySelector<HTMLInputElement>('input[type="email"]');
  if (!input) throw new Error("Không tìm thấy ô email nhóm.");
  return input;
}

function groupToggle() {
  const label = [...host.querySelectorAll("label")].find((item) =>
    item.textContent?.includes(groupPanel.invite),
  );
  const box = label?.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!box) throw new Error(`Không tìm thấy checkbox: ${groupPanel.invite}`);
  return box;
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (!setter) throw new Error("jsdom không có HTMLInputElement.value setter.");
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function openGroup() {
  await act(async () => groupToggle().click());
}

async function enterMember(email: string) {
  await act(async () => setNativeValue(emailInput(), email));
  await act(async () => {
    emailInput().dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
  });
}

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  mocks.store.listeners.clear();
  mocks.store.ids = [groupCourse.id];
  mocks.fetch.mockReset();
  mocks.push.mockReset();
  mocks.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      email: "nhomtruong@example.com",
      catalog: [groupCourse],
      staleIds: [],
    }),
  });
  vi.stubGlobal("fetch", mocks.fetch);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<CartClient />));
  await flush();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("giỏ hàng — thanh toán nhóm", () => {
  it("bỏ toàn bộ thành viên và input ẩn khi khóa ưu đãi rời giỏ", async () => {
    await openGroup();
    await enterMember("thanhvien@example.com");
    expect(host.querySelectorAll('input[name="thanhVien"]')).toHaveLength(1);

    const courseCheckbox = host.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!courseCheckbox) throw new Error("Không tìm thấy checkbox khóa học.");
    await act(async () => courseCheckbox.click());

    expect(host.querySelectorAll('input[name="thanhVien"]')).toHaveLength(0);
    expect([...host.querySelectorAll('[role="status"]')].some((item) =>
      item.textContent?.includes(groupPanel.dropped),
    )).toBe(true);
  });

  it("bỏ email của nhóm trưởng mà không đổi số người hoặc tổng tiền", async () => {
    const total = () => host.querySelector<HTMLInputElement>('input[name="tongTienDuKien"]')?.value;
    expect(total()).toBe("300000");

    await openGroup();
    await enterMember(" NhomTruong@Example.com ");

    expect(host.textContent).not.toContain("NhomTruong@Example.com");
    expect(host.querySelectorAll('input[name="thanhVien"]')).toHaveLength(0);
    expect(total()).toBe("300000");
  });
});
