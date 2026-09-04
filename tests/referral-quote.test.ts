import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  orderFindFirst: vi.fn(),
  ledgerAggregate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    order: { findFirst: mocks.orderFindFirst },
    referralLedger: { aggregate: mocks.ledgerAggregate },
  },
}));

import { referralQuoteFor } from "@/lib/referral-quote";

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 0 } });
});

/**
 * `eligible` và `canEnterCode` loại trừ nhau theo đúng cách dựng: người đã có
 * người giới thiệu và chưa chốt đơn nào thì thấy dòng giảm giá; người CHƯA có
 * người giới thiệu và chưa chốt đơn nào thì thấy ô nhập mã.
 */
describe("referralQuoteFor", () => {
  it("chưa có người giới thiệu, chưa có đơn → canEnterCode, không eligible", async () => {
    mocks.userFindUnique.mockResolvedValue({ referredById: null });
    mocks.orderFindFirst.mockResolvedValue(null);

    await expect(referralQuoteFor("user-1")).resolves.toMatchObject({
      eligible: false,
      canEnterCode: true,
    });
  });

  it("đã có người giới thiệu, chưa có đơn → eligible, không cho nhập mã nữa", async () => {
    mocks.userFindUnique.mockResolvedValue({ referredById: "user-referrer" });
    mocks.orderFindFirst.mockResolvedValue(null);

    await expect(referralQuoteFor("user-1")).resolves.toMatchObject({
      eligible: true,
      canEnterCode: false,
    });
  });

  it("đã có đơn chốt quyền ưu đãi → không eligible, cũng không cho nhập mã", async () => {
    mocks.userFindUnique.mockResolvedValue({ referredById: null });
    mocks.orderFindFirst.mockResolvedValue({ id: "order-cu" });

    await expect(referralQuoteFor("user-1")).resolves.toMatchObject({
      eligible: false,
      canEnterCode: false,
    });
  });
});
