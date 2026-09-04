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
import { groupPanel } from "@/content/checkout";

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

/**
 * Giá nhóm giảm ÍT hơn 10% (950k/1.000k = 5%), cố ý.
 *
 * Bậc nhóm mặc định giảm đúng 10%, tức bằng khoản giới thiệu, và
 * `referralDiscountVnd` sẽ trả về 0 — một con số 0 không phân biệt được "hai ưu
 * đãi không cộng dồn" với "cờ eligible bị tắt nhầm". Mức 5% ép hàm phải trả về
 * PHẦN CHÊNH, tức nhánh mà chỉ đơn nhóm của người được giới thiệu mới đi qua.
 */
const groupCourse = {
  id: "course-group",
  code: "AIQT",
  slug: "nckh-ung-dung-ai-xuat-ban-quoc-te",
  title: "NCKH ứng dụng AI",
  priceVnd: 1_000_000,
  groupEligible: true,
  groupPriceVnd: 950_000,
  availability: "buyable" as const,
  seatsLeft: 15,
};

let host: HTMLDivElement;
let root: Root;

function CartHarness({ courseId = soloCourse.id }: { courseId?: string }) {
  const [ids, setIds] = useState([courseId]);
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

async function renderWith(
  referral: Record<string, unknown>,
  course: typeof soloCourse | typeof groupCourse = soloCourse,
) {
  mocks.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      email: "mua@example.com",
      catalog: [course],
      staleIds: [],
      referral,
    }),
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<CartHarness courseId={course.id} />));
  await flush();
}

function emailInput() {
  const input = host.querySelector<HTMLInputElement>('input[type="email"]');
  if (!input) throw new Error("Không tìm thấy ô email nhóm.");
  return input;
}

async function inviteMembers(...emails: string[]) {
  const toggle = [...host.querySelectorAll("label")]
    .find((item) => item.textContent?.includes(groupPanel.invite))
    ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!toggle) throw new Error("Không tìm thấy công tắc mời nhóm.");
  await act(async () => toggle.click());
  for (const email of emails) {
    await act(async () => setNativeValue(emailInput(), email));
    await act(async () => {
      emailInput().dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });
  }
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

  /**
   * ĐÂY LÀ BÀI GIỮ CHO ĐƠN NHÓM CỦA NGƯỜI ĐƯỢC GIỚI THIỆU THANH TOÁN ĐƯỢC.
   *
   * `app/actions/checkout.ts` so `tongTienDuKien` với `amountVnd` bằng phép so
   * bằng tuyệt đối rồi HỦY đơn nếu lệch. Với đơn nhóm, khoản giảm giới thiệu
   * không phải 10% phẳng mà là phần chênh so với ưu đãi nhóm — nhánh dễ viết
   * lệch nhất giữa hai phía. Con số dưới đây được suy ra từ chính luật, không
   * chép từ một lần chạy:
   *
   *   giá niêm yết  3 × 1.000.000 = 3.000.000
   *   giá ghế nhóm  3 ×   950.000 = 2.850.000  (nhóm đã giảm 150.000)
   *   mức cao nhất  10% × 3.000.000 = 300.000
   *   phần chênh    300.000 − 150.000 = 150.000
   *   phải trả      2.850.000 − 150.000 = 2.700.000
   *
   * `tests/referral-order-creation.test.ts` chạy cùng bộ dữ liệu này ở phía
   * server; hai con số phải bằng nhau.
   */
  it("khớp con số server ở đơn nhóm, nơi khoản giảm chỉ là phần chênh", async () => {
    await renderWith(
      { eligible: false, canEnterCode: true, creditBalanceVnd: 0 },
      groupCourse,
    );

    await inviteMembers("ban1@example.com", "ban2@example.com");
    // Chưa có preview của server (debounce 350ms chưa chạy), nên giỏ đang dùng
    // đúng nhánh tự tính của mình — cũng là con số đi theo form nếu người mua
    // bấm ngay lúc này.
    expect(hiddenTotal()).toBe("2850000");

    await act(async () => setNativeValue(codeInput()!, "SKGAXBZR"));
    await flush();

    expect(hiddenTotal()).toBe("2700000");
  });

  it("không hiện ô nhập mã khi giỏ không còn khóa nào mua được", async () => {
    await renderWith(
      { eligible: false, canEnterCode: true, creditBalanceVnd: 0 },
      { ...soloCourse, availability: "sold_out" as unknown as "buyable" },
    );

    expect(codeInput()).toBeNull();
  });

  it("ẩn ô nhập mã khi không canEnterCode", async () => {
    await renderWith({ eligible: true, canEnterCode: false, creditBalanceVnd: 0 });
    expect(codeInput()).toBeNull();
  });
});
