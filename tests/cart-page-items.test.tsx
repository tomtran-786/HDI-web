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
    params: new URLSearchParams(),
    store,
    add: vi.fn((id: string) => {
      if (!store.ids.includes(id)) store.setIds([...store.ids, id]);
    }),
    remove: vi.fn((id: string) => store.setIds(store.ids.filter((value) => value !== id))),
    trackAdd: vi.fn(),
    trackRemove: vi.fn(),
  };
});

vi.mock("next/navigation", () => {
  const router = { push: mocks.push };
  return { useRouter: () => router, useSearchParams: () => mocks.params };
});
vi.mock("@/app/actions/checkout", () => ({ checkout: vi.fn() }));
vi.mock("@/lib/analytics", () => ({
  trackCartAdd: mocks.trackAdd,
  trackCartRemove: mocks.trackRemove,
  trackCheckout: vi.fn(),
}));
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
        clear: () => mocks.store.setIds([]),
        openCart: () => undefined,
      };
    },
  };
});

import { CartClient } from "@/app/gio-hang/cart-client";
import { CartItemCount } from "@/app/gio-hang/cart-item-count";
import { cartPage, groupPanel } from "@/content/checkout";

const cover = {
  kind: "photo" as const,
  src: "/images/khoa-hoc/viet-bao-cao-khoa-hoc.jpg",
  alt: "Ảnh bìa",
  credit: { author: "Test", url: "https://example.com" },
};

const base = {
  groupEligible: false,
  groupPriceVnd: null,
  availability: "buyable" as const,
  seatsLeft: 10,
  cover,
  schedule: "Thứ Hai hằng tuần, 07/12 – 21/12/2026",
  format: "Trực tuyến qua Zoom",
  pendingOrderCode: null,
};
const tieuLuan = {
  ...base,
  id: "c-tieuluan",
  code: "TIEULUAN",
  slug: "training-tieu-luan-nckh-kltn",
  title: "Viết tiểu luận, NCKH & KLTN",
  priceVnd: 300_000,
  groupEligible: true,
  groupPriceVnd: 250_000,
};
const spss = {
  ...base,
  id: "c-spss",
  code: "SPSS",
  slug: "nckh-chuyen-sau-spss",
  title: "Phân tích định lượng với SPSS",
  priceVnd: 500_000,
};
const stata = { ...base, id: "c-stata", code: "STATA", slug: "kinh-te-luong-stata-ai", title: "Stata", priceVnd: 400_000 };
const aiqt = { ...base, id: "c-aiqt", code: "AIQT", slug: "nckh-ung-dung-ai-xuat-ban-quoc-te", title: "NCKH ứng dụng AI", priceVnd: 3_000_000 };
const full = { ...base, id: "c-full", code: "HET", slug: "viet-bai-tap-chi", title: "Khóa hết chỗ", priceVnd: 100_000, availability: "full" as const, seatsLeft: 0 };

let host: HTMLDivElement;
let root: Root;

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function mount(catalog: unknown[], ids: string[], course?: string) {
  mocks.params = new URLSearchParams(course ? { course } : {});
  mocks.store.listeners.clear();
  mocks.store.ids = ids;
  mocks.fetch.mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      email: "mua@example.com",
      catalog,
      staleIds: [],
      referral: { eligible: false, canEnterCode: false, creditBalanceVnd: 0 },
    }),
  }));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root.render(
      <>
        <CartItemCount />
        <CartClient />
      </>,
    ),
  );
  await flush();
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  mocks.fetch.mockReset();
  mocks.push.mockReset();
  mocks.add.mockClear();
  mocks.remove.mockClear();
  mocks.trackAdd.mockClear();
  mocks.trackRemove.mockClear();
  vi.stubGlobal("fetch", mocks.fetch);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const removeButtons = () =>
  [...host.querySelectorAll<HTMLButtonElement>("button")].filter((button) =>
    button.getAttribute("aria-label")?.startsWith("Xóa khóa"),
  );

describe("giỏ hàng — chỉ liệt kê khóa đang trong giỏ", () => {
  it("không còn checkbox chọn khóa: chỉ các khóa trong cookie xuất hiện, kèm meta", async () => {
    await mount([tieuLuan, spss, stata], [tieuLuan.id]);

    const row = host.querySelector(`#cart-course-${tieuLuan.slug}`)!;
    expect(row.textContent).toContain(tieuLuan.title);
    expect(row.textContent).toContain(`${cartPage.line.code}:TIEULUAN`);
    expect(row.textContent).toContain(`${cartPage.line.schedule}:${tieuLuan.schedule}`);
    expect(row.textContent).toContain(`${cartPage.line.format}:${tieuLuan.format}`);
    // Khóa còn lại trong catalog nhưng chưa vào giỏ thì không hiện.
    expect(host.querySelector(`#cart-course-${spss.slug}`)).toBeNull();
    expect(host.textContent).not.toContain(spss.title);
    expect(host.querySelectorAll('ul input[type="checkbox"]')).toHaveLength(0);
  });

  it("header đếm số khóa theo cookie", async () => {
    await mount([tieuLuan, spss], [tieuLuan.id, spss.id]);
    expect(host.textContent).toContain(cartPage.itemCount(2));
  });

  it("nút Xóa gọi remove(id), báo analytics, và giỏ cập nhật ngay", async () => {
    await mount([tieuLuan, spss], [tieuLuan.id, spss.id]);
    expect(removeButtons()).toHaveLength(2);

    await act(async () => removeButtons()[0].click());

    expect(mocks.remove).toHaveBeenCalledWith(tieuLuan.id);
    expect(mocks.trackRemove).toHaveBeenCalledWith(tieuLuan.slug);
    expect(host.querySelector(`#cart-course-${tieuLuan.slug}`)).toBeNull();
    expect(host.querySelector(`#cart-course-${spss.slug}`)).not.toBeNull();
    expect(host.textContent).toContain(cartPage.itemCount(1));
  });

  it("nút Xóa mang tên khóa cho trình đọc màn hình", async () => {
    await mount([spss], [spss.id]);
    expect(removeButtons()[0].getAttribute("aria-label")).toBe(
      cartPage.removeLabel(spss.title),
    );
    expect(removeButtons()[0].textContent).toBe(cartPage.remove);
  });

  it("giá có ưu đãi nhóm: giá thật to đứng sau giá gốc gạch ngang, kèm điều kiện", async () => {
    await mount([tieuLuan], [tieuLuan.id]);
    // Mua một mình: giá lẻ, nhưng nhắc giá nhóm kèm điều kiện ngay cạnh.
    const row = host.querySelector(`#cart-course-${tieuLuan.slug}`)!;
    expect(row.textContent).toContain("300.000");
    expect(row.textContent).toContain(groupPanel.dealBadge);
    expect(row.querySelector("s")).toBeNull();
  });

  it("khóa trong giỏ không còn mua được hiện badge thay cho giá, không có trong tổng", async () => {
    await mount([spss, full], [spss.id, full.id]);

    const row = host.querySelector(`#cart-course-${full.slug}`)!;
    expect(row.textContent).toContain("Đã hết chỗ");
    expect(row.textContent).not.toContain("100.000");
    const hidden = host.querySelector<HTMLInputElement>('input[name="tongTienDuKien"]');
    expect(hidden?.value).toBe("500000");
  });
});

describe("giỏ hàng — ?course= tự thêm khóa", () => {
  it("thêm khóa mua được vào giỏ đúng một lần, kể cả sau khi bấm Xóa", async () => {
    await mount([tieuLuan, spss], [], spss.slug);

    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(mocks.add).toHaveBeenCalledWith(spss.id);
    expect(mocks.trackAdd).toHaveBeenCalledWith(spss.slug);
    expect(host.querySelector(`#cart-course-${spss.slug}`)).not.toBeNull();

    await act(async () => removeButtons()[0].click());
    await flush();

    // Xóa xong khóa không tự quay lại.
    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain(cartPage.empty.title);
  });

  it("khóa đã nằm trong giỏ thì không thêm lần nữa", async () => {
    await mount([tieuLuan, spss], [spss.id], spss.slug);
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it("khóa không đăng ký được thì báo lý do và không thêm", async () => {
    await mount([spss, full], [spss.id], full.slug);

    expect(mocks.add).not.toHaveBeenCalled();
    expect(host.textContent).toContain(
      cartPage.focusUnavailable(full.title, "Đã hết chỗ"),
    );
  });

  it("slug không có trong catalog (khóa đang ẩn) thì im lặng, không thêm", async () => {
    await mount([spss], [], "viet-bao-cao-khoa-hoc");

    expect(mocks.add).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain("không thể thêm vào giỏ");
  });
});

describe("giỏ hàng — giỏ trống", () => {
  it("hiện thông báo, link xem khóa đang mở và tối đa 3 gợi ý đang bán", async () => {
    await mount([tieuLuan, spss, stata, aiqt, full], []);

    expect(host.textContent).toContain(cartPage.empty.title);
    const browse = [...host.querySelectorAll("a")].find(
      (link) => link.textContent?.includes(cartPage.empty.browse),
    );
    expect(browse?.getAttribute("href")).toBe("/khoa-hoc");

    const suggested = [...host.querySelectorAll("li h3")].map((h) => h.textContent);
    expect(suggested).toEqual([tieuLuan.title, spss.title, stata.title]);
    expect(host.textContent).not.toContain(full.title);
    // Không có thẻ tóm tắt đơn hay nút thanh toán khi giỏ trống.
    expect(host.textContent).not.toContain(cartPage.summaryTitle);
    expect(host.querySelector("#cart-checkout-form")).toBeNull();
  });

  it("nút Thêm vào giỏ của gợi ý đưa khóa vào giỏ", async () => {
    await mount([tieuLuan, spss], []);
    const add = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === cartPage.empty.add,
    )!;

    await act(async () => add.click());

    expect(mocks.add).toHaveBeenCalledWith(tieuLuan.id);
    expect(host.querySelector(`#cart-course-${tieuLuan.slug}`)).not.toBeNull();
    expect(host.textContent).toContain(cartPage.summaryTitle);
  });

  it("chưa nạp xong catalog thì chưa nói giỏ trống", async () => {
    mocks.params = new URLSearchParams();
    mocks.store.listeners.clear();
    mocks.store.ids = [];
    mocks.fetch.mockImplementation(() => new Promise(() => {}));
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root.render(<CartClient />));

    expect(host.textContent).not.toContain(cartPage.empty.title);
  });
});

describe("giỏ hàng — thẻ tóm tắt", () => {
  it("có các dòng Tạm tính / Tổng thanh toán, nút Thanh toán là submit đầu tiên trong DOM", async () => {
    await mount([spss], [spss.id]);

    expect(host.textContent).toContain(cartPage.summaryTitle);
    expect(host.textContent).toContain(cartPage.subtotal);
    expect(host.textContent).toContain(cartPage.total);
    const firstSubmit = host.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(firstSubmit?.closest("form")?.id).toBe("cart-checkout-form");
    expect(firstSubmit?.textContent).toBe("Thanh toán");
  });
});
