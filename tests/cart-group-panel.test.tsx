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

/** Khóa thứ hai, để tick thêm vào giỏ giữa lúc đang cầm một báo giá nhóm. */
const soloCourse = {
  id: "course-solo",
  code: "AIQT",
  slug: "ai-quan-tri",
  title: "AI trong quản trị",
  priceVnd: 500_000,
  groupEligible: false,
  groupPriceVnd: null,
  availability: "buyable" as const,
  seatsLeft: 10,
};

/**
 * Định tuyến `fetch` theo URL: catalog và báo giá nhóm là hai endpoint khác
 * nhau, và các test dưới đây cần dựng riêng phản hồi của endpoint thứ hai.
 */
function routeFetch(
  catalog: unknown[],
  preview: Record<string, unknown> | null,
) {
  mocks.fetch.mockImplementation(async (url: string) => {
    if (String(url).includes("/nhom")) {
      if (!preview) return { ok: false, status: 429, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => preview };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        email: "nhomtruong@example.com",
        catalog,
        staleIds: [],
      }),
    };
  });
}

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

/**
 * Dựng lại giỏ hàng với một catalog / báo giá khác.
 *
 * Catalog chỉ được nạp một lần lúc mount, nên test nào cần bộ khóa khác bộ mặc
 * định của `beforeEach` phải đi qua đây.
 */
async function remount(catalog: unknown[], preview: Record<string, unknown> | null) {
  await act(async () => root.unmount());
  routeFetch(catalog, preview);
  root = createRoot(host);
  await act(async () => root.render(<CartClient />));
  await flush();
}

/** Chờ qua debounce 350 ms của báo giá nhóm rồi để phản hồi lắng xuống. */
async function settlePreview() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
  await flush();
}

function submitButton() {
  const button = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (item) => item.type === "submit",
  );
  if (!button) throw new Error("Không tìm thấy nút Thanh toán.");
  return button;
}

function hiddenTotal() {
  return host.querySelector<HTMLInputElement>('input[name="tongTienDuKien"]')?.value;
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
    const total = hiddenTotal;
    expect(total()).toBe("300000");

    await openGroup();
    await enterMember(" NhomTruong@Example.com ");

    expect(host.textContent).not.toContain("NhomTruong@Example.com");
    expect(host.querySelectorAll('input[name="thanhVien"]')).toHaveLength(0);
    expect(total()).toBe("300000");
  });

  /**
   * Chốt chặn thành viên chưa có tài khoản.
   *
   * Server đếm `groupSize` là số người PHÂN GIẢI ĐƯỢC, client đếm số email đã
   * gõ — hễ có một người chưa đăng ký thì hai con số lệch nhau, và phép so
   * `preview.groupSize === groupSize` từng gác `blocked` sẽ sai đúng lúc
   * `blocked` bằng `true`. Kết quả: chốt chặn duy nhất cho ca này không bao giờ
   * chạy. `requestedSize` là con số phải so.
   */
  it("khóa nút Thanh toán khi có thành viên chưa có tài khoản", async () => {
    await remount([groupCourse], {
      groupSize: 1,
      requestedSize: 2,
      cartKey: groupCourse.id,
      discountApplies: false,
      members: [
        { email: "chuadangky@example.com", registered: false, conflict: false },
      ],
      totalVnd: 300_000,
      blocked: true,
    });

    await openGroup();
    await enterMember("chuadangky@example.com");
    await settlePreview();

    expect(host.textContent).toContain(groupPanel.unregistered);
    expect(submitButton().disabled).toBe(true);
  });

  /**
   * Báo giá cũ không được trả lời cho một giỏ hàng khác.
   *
   * Effect báo giá debounce 350 ms và chỉ bật `previewLoading` bên trong callback,
   * nên ngay sau khi tick thêm một khóa thì số người không đổi — một phép so chỉ
   * dựa vào số người vẫn thấy "khớp" trong khi `totalVnd` là tổng của giỏ trước.
   * `tongTienDuKien` đi lên server với con số đó là một đơn bị tạo rồi hủy ngay
   * ở nhánh chốt giá của app/actions/checkout.ts.
   */
  it("không dùng báo giá của giỏ cũ khi vừa tick thêm một khóa", async () => {
    await remount([groupCourse, soloCourse], {
      groupSize: 2,
      requestedSize: 2,
      cartKey: groupCourse.id,
      discountApplies: false,
      members: [
        { email: "thanhvien@example.com", registered: true, conflict: false },
      ],
      totalVnd: 600_000,
      blocked: false,
    });

    await openGroup();
    await enterMember("thanhvien@example.com");
    await settlePreview();
    expect(hiddenTotal()).toBe("600000");

    const soloBox = host.querySelector<HTMLInputElement>(
      `#cart-course-${soloCourse.slug} input[type="checkbox"]`,
    );
    if (!soloBox) throw new Error("Không tìm thấy checkbox khóa thứ hai.");
    await act(async () => soloBox.click());

    // (300.000 + 500.000) × 2 ghế — giỏ MỚI, không phải 600.000 của giỏ cũ.
    expect(hiddenTotal()).toBe("1600000");
    expect(submitButton().disabled).toBe(true);
  });

  /**
   * Báo giá hỏng (mạng chớp, hoặc chạm rate limit 60 lượt/giờ) từng chỉ set
   * `preview = null` trong im lặng — mà `blocked` đọc từ `preview`, nên nó tụt
   * về `false` và nút Thanh toán sáng lên với đúng danh sách nhóm chưa ai xác
   * nhận được.
   */
  it("báo giá hỏng thì nói ra và vẫn khóa nút Thanh toán", async () => {
    await remount([groupCourse], null);

    await openGroup();
    await enterMember("thanhvien@example.com");
    await settlePreview();

    expect(host.textContent).toContain(groupPanel.checkFailed);
    expect(submitButton().disabled).toBe(true);
  });
});
