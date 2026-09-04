// @vitest-environment jsdom

import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/app/actions/checkout", () => ({ checkout: vi.fn() }));
vi.mock("@/lib/analytics", () => ({
  trackCartAdd: vi.fn(),
  trackCartRemove: vi.fn(),
  trackCheckout: vi.fn(),
}));

import { CartModal } from "@/components/cart-modal";

const soloCourse = {
  id: "course-solo",
  code: "TIEULUAN",
  slug: "training-tieu-luan-nckh-kltn",
  title: "Tiểu luận nghiên cứu khoa học",
  priceVnd: 300_000,
  groupEligible: false,
  groupPriceVnd: null,
  availability: "buyable" as const,
  seatsLeft: 10,
};

let host: HTMLDivElement;
let root: Root;

function CartHarness() {
  const [ids, setIds] = useState([soloCourse.id]);
  return (
    <CartModal
      open
      focusSlug={null}
      ids={ids}
      full={false}
      add={(id) => setIds((current) => [...current, id])}
      remove={(id) => setIds((current) => current.filter((value) => value !== id))}
      onClose={() => undefined}
    />
  );
}

function codeInput() {
  return host.querySelector<HTMLInputElement>('input[name="maGioiThieu"]');
}
function hiddenTotal() {
  return host.querySelector<HTMLInputElement>('input[name="tongTienDuKien"]')?.value;
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

async function renderWith(referral: Record<string, unknown>) {
  mocks.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      email: "mua@example.com",
      catalog: [soloCourse],
      staleIds: [],
      referral,
    }),
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<CartHarness />));
  await flush();
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  for (const name of ["showModal", "close"] as const) {
    Object.defineProperty(HTMLDialogElement.prototype, name, {
      configurable: true,
      value() {
        this.open = name === "showModal";
      },
    });
  }
  mocks.fetch.mockReset();
  mocks.push.mockReset();
  vi.stubGlobal("fetch", mocks.fetch);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("giỏ hàng — ô mã giới thiệu ở checkout", () => {
  it("hiện ô nhập mã khi canEnterCode và trừ 10% vào tổng khi gõ mã", async () => {
    await renderWith({ eligible: false, canEnterCode: true, creditBalanceVnd: 0 });

    const input = codeInput();
    expect(input).not.toBeNull();
    expect(hiddenTotal()).toBe("300000");

    await act(async () => setNativeValue(input!, "skgaxbzr"));
    await flush();

    // Client lạc quan coi mã đã gõ là hợp lệ để `tongTienDuKien` khớp con số
    // server sắp áp — nếu không nhánh chốt giá sẽ hủy đơn vừa tạo.
    expect(input!.value).toBe("SKGAXBZR");
    expect(hiddenTotal()).toBe("270000");
  });

  it("ẩn ô nhập mã khi không canEnterCode", async () => {
    await renderWith({ eligible: true, canEnterCode: false, creditBalanceVnd: 0 });
    expect(codeInput()).toBeNull();
  });
});
