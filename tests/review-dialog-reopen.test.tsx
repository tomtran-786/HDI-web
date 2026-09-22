// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Hộp thoại đánh giá phải mở lại được ở trạng thái form.
 *
 * `useActionState` giữ `state.saved` tới hết vòng đời component, và đây là
 * client component nên `revalidatePath("/tai-khoan")` không dọn nó: sau một lần
 * gửi, bấm "Sửa đánh giá" chỉ mở ra đúng màn "Đã gửi" và học viên phải tải lại
 * cả trang mới sửa được.
 */

const mocks = vi.hoisted(() => ({ saveReview: vi.fn() }));

vi.mock("@/app/tai-khoan/actions", () => ({ saveReview: mocks.saveReview }));

import { ReviewForm } from "@/app/tai-khoan/review-form";
import { review } from "@/content/review";

let host: HTMLDivElement;
let root: Root;

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function openButton() {
  const button = [...host.querySelectorAll("button")].find(
    (item) =>
      item.textContent === review.rateCta || item.textContent === review.editCta,
  );
  if (!button) throw new Error("Không tìm thấy nút mở đánh giá.");
  return button;
}

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  mocks.saveReview.mockReset();
  mocks.saveReview.mockResolvedValue({ saved: true });
  // jsdom chưa cài showModal/close cho <dialog>.
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };

  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<ReviewForm courseId="course-1" />));
  await flush();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

describe("hộp thoại đánh giá khóa học", () => {
  it("mở lại sau khi gửi thành công thì thấy form, không phải màn Đã gửi", async () => {
    await act(async () => openButton().click());

    const form = host.querySelector("form");
    if (!form) throw new Error("Không tìm thấy form đánh giá.");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(host.textContent).toContain(review.saved);

    // Đóng rồi mở lại — đúng thao tác của một học viên muốn sửa đánh giá vừa gửi.
    await act(async () => {
      const close = [...host.querySelectorAll("button")].find(
        (item) => item.textContent === review.close,
      );
      close?.click();
    });
    await act(async () => openButton().click());
    await flush();

    expect(host.textContent).not.toContain(review.saved);
    expect(host.querySelector('textarea[name="comment"]')).not.toBeNull();
    // Nhãn ngoài thẻ vẫn phải nhớ là vừa gửi, dù thân hộp thoại đã được dựng lại.
    expect(host.textContent).toContain(review.statusHint.pending);
  });

  /**
   * Dựng lại thân hộp thoại là để dọn `state.saved`, KHÔNG phải để dọn ô nhận
   * xét. Bấm "Hủy" rồi mở lại là thao tác của người đang cân nhắc câu chữ; nuốt
   * mất bản nháp của họ là một cách sửa lỗi này thành một lỗi khác.
   */
  it("giữ bản nháp khi đóng rồi mở lại, chừng nào chưa gửi", async () => {
    await act(async () => openButton().click());

    const box = host.querySelector<HTMLTextAreaElement>('textarea[name="comment"]');
    if (!box) throw new Error("Không tìm thấy ô nhận xét.");
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      setter!.call(box, "Đang viết dở");
      box.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      const cancel = [...host.querySelectorAll("button")].find(
        (item) => item.textContent === review.cancel,
      );
      cancel?.click();
    });
    await act(async () => openButton().click());
    await flush();

    expect(
      host.querySelector<HTMLTextAreaElement>('textarea[name="comment"]')?.value,
    ).toBe("Đang viết dở");
  });
});
