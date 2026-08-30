import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Server action, router và analytics không chạy được trong Node trần của
// Vitest — mock đúng những thứ đó, phần còn lại là component thật.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/actions/checkout", () => ({ checkout: vi.fn() }));
vi.mock("@/lib/analytics", () => ({
  trackCartAdd: vi.fn(),
  trackCartRemove: vi.fn(),
  trackCheckout: vi.fn(),
}));

import { CartModal } from "@/components/cart-modal";
import { groupPanel } from "@/content/checkout";

const noop = () => {};

function render() {
  return renderToStaticMarkup(
    <CartModal
      open
      focusSlug={null}
      ids={["course-1"]}
      full={false}
      add={noop}
      remove={noop}
      onClose={noop}
    />,
  );
}

describe("giỏ hàng — khối thanh toán nhóm", () => {
  const html = render();

  /**
   * Trước khi catalog về, giỏ chưa có khóa nào nên chưa biết khóa có ưu đãi
   * nhóm hay không — lời mời chỉ được hiện sau khi biết, chứ không hứa suông.
   */
  it("chưa mời vào nhóm khi giỏ còn trống", () => {
    expect(html).not.toContain(groupPanel.invite);
  });

  it("gửi tổng tiền đang hiển thị kèm form để server đối chiếu", () => {
    expect(html).toContain('name="tongTienDuKien"');
  });

  it("không gửi số người hay số tiền nào khác lên server", () => {
    // Server tự phân giải nhóm từ email; mọi con số khác đều không đáng tin.
    expect(html).not.toContain('name="groupSize"');
    expect(html).not.toContain('name="amountVnd"');
  });
});
