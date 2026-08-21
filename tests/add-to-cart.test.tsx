import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const add = vi.hoisted(() => vi.fn());
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({ has: () => false, add, full: false }),
}));

import { AddToCart } from "@/components/add-to-cart";

describe("purchase login gate", () => {
  it("renders a login link and never adds for a signed-out visitor", () => {
    const html = renderToStaticMarkup(
      <AddToCart
        cohortId="cohort-1"
        courseSlug="course"
        ky="K1"
        blocked={null}
        signedIn={false}
        loginReturnTo="/dang-ky/course"
      />,
    );
    expect(html).toContain("/dang-nhap?tiep=%2Fdang-ky%2Fcourse");
    expect(html).toContain("Đăng nhập để đăng ký");
    expect(add).not.toHaveBeenCalled();
  });
});

