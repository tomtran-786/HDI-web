// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/reveal-observer", () => ({ observeReveal: () => () => {} }));

import { ConferenceMap } from "@/components/conference-map";

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<ConferenceMap />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

const pin = (name: string) =>
  [...host.querySelectorAll<HTMLButtonElement>("[data-map-pin] button")].find(
    (button) => button.getAttribute("aria-label")?.startsWith(name),
  )!;
const tooltipOf = (button: HTMLElement) =>
  button.parentElement!.querySelector<HTMLElement>('[role="tooltip"]')!;
const isShown = (tip: HTMLElement) => tip.className.includes("visible opacity-100") &&
  !tip.className.includes("invisible opacity-0 group");

describe("tooltip của ghim trên bản đồ", () => {
  it("chạm vào ghim mở tooltip, chạm lần nữa đóng lại", async () => {
    const button = pin("Bangkok");
    expect(button.getAttribute("aria-expanded")).toBe("false");

    await act(async () => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(tooltipOf(button).className).toMatch(/(^| )visible opacity-100/);

    await act(async () => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("Esc đóng tooltip đang mở, và cả tooltip hiện bằng hover/focus", async () => {
    const button = pin("Taichung");
    await act(async () => button.click());
    expect(isShown(tooltipOf(button))).toBe(true);

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    const tip = tooltipOf(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    // Sau Esc tooltip không còn lớp hover/focus nên rê chuột hay focus cũng không mở lại.
    expect(tip.className).toContain("invisible opacity-0");
    expect(tip.className).not.toContain("group-hover");
    expect(tip.className).not.toContain("group-focus-within");

    // Chạm tới ghim khác thì tooltip hoạt động trở lại.
    await act(async () => {
      pin("Warsaw").dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
      pin("Warsaw").dispatchEvent(new Event("pointerenter"));
    });
    await act(async () => pin("Warsaw").focus());
    expect(tooltipOf(pin("Warsaw")).className).toContain("group-hover");
  });

  it("thẻ số liệu chỉ được đọc một lần: phần hiển thị bị ẩn khỏi trình đọc", () => {
    const list = host.querySelector("dl")!;
    const srLabels = [...list.querySelectorAll("dt")].map((dt) => dt.textContent);
    expect(srLabels).toContain("Công bố quốc tế: 25+");
    for (const dd of list.querySelectorAll("dd")) {
      expect(dd.getAttribute("aria-hidden")).toBe("true");
    }
  });
});
