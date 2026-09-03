import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  expire: vi.fn(),
  grants: vi.fn(),
  revokes: vi.fn(),
  throttles: vi.fn(),
  tokens: vi.fn(),
  leases: vi.fn(),
  services: vi.fn(),
  referralRepairs: vi.fn(),
  expireCredits: vi.fn(),
  reconcilePaid: vi.fn(),
  reconcilePaidSvc: vi.fn(),
  webhookHealth: vi.fn(),
}));

vi.mock("@/lib/orders", () => ({ expireStaleOrders: mocks.expire }));
vi.mock("@/lib/service-orders", () => ({
  expireStaleServiceOrders: mocks.services,
}));
vi.mock("@/lib/fulfillment", () => ({
  reconcileMissingDriveGrants: mocks.grants,
  revokeExpiredDriveAccess: mocks.revokes,
}));
vi.mock("@/lib/payos-reconcile", () => ({
  reconcilePaidPayosOrders: mocks.reconcilePaid,
  reconcilePaidPayosServiceOrders: mocks.reconcilePaidSvc,
  checkPayosWebhookHealth: mocks.webhookHealth,
}));
vi.mock("@/lib/auth-throttle", () => ({ pruneAuthThrottles: mocks.throttles }));
vi.mock("@/lib/auth-tokens", () => ({ pruneExpiredAuthTokens: mocks.tokens }));
vi.mock("@/lib/external-lease", () => ({ pruneExpiredLeases: mocks.leases }));
vi.mock("@/lib/referral-ledger", () => ({
  repairReferralReservations: mocks.referralRepairs,
  expireCredits: mocks.expireCredits,
}));

import { GET } from "@/app/api/cron/don-hang-het-han/route";

function authorized() {
  return new Request("https://hdi.test/api/cron", {
    headers: { authorization: "Bearer cron-test-secret" },
  });
}

describe("bounded housekeeping cron route", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    process.env.CRON_SECRET = "cron-test-secret";
    mocks.expire.mockResolvedValue({ scanned: 0, expired: 0, released: 0 });
    mocks.grants.mockResolvedValue({ checked: 0, granted: 0 });
    mocks.revokes.mockResolvedValue({ checked: 0, revoked: 0, kept: 0, failed: 0 });
    mocks.throttles.mockResolvedValue(0);
    mocks.tokens.mockResolvedValue(0);
    mocks.leases.mockResolvedValue(0);
    mocks.services.mockResolvedValue({ expired: 0 });
    mocks.referralRepairs.mockResolvedValue(0);
    mocks.expireCredits.mockResolvedValue({ users: 0, totalVnd: 0 });
    mocks.reconcilePaid.mockResolvedValue({ scanned: 0, confirmed: 0, review: 0 });
    mocks.reconcilePaidSvc.mockResolvedValue({ scanned: 0, confirmed: 0, review: 0 });
    mocks.webhookHealth.mockResolvedValue({
      healthy: true,
      lastPaymentAt: new Date(),
      pendingWithLink: 0,
    });
  });

  it("returns 404 without the bearer secret and performs no work", async () => {
    const response = await GET(new Request("https://hdi.test/api/cron"));
    expect(response.status).toBe(404);
    for (const mock of Object.values(mocks)) expect(mock).not.toHaveBeenCalled();
  });

  it("runs each bounded housekeeping pass for an authorized request", async () => {
    const response = await GET(authorized());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      orders: { scanned: 0, expired: 0, released: 0 },
      reclaimedOrders: { scanned: 0, confirmed: 0, review: 0 },
      reclaimedServices: { scanned: 0, confirmed: 0, review: 0 },
      webhookHealth: { healthy: true, pendingWithLink: 0 },
      services: { expired: 0 },
      referralRepairs: 0,
      expiredCredits: { users: 0, totalVnd: 0 },
      driveGrants: { checked: 0, granted: 0 },
      pruned: { throttles: 0, tokens: 0, leases: 0 },
    });
    for (const mock of Object.values(mocks)) expect(mock).toHaveBeenCalledOnce();
  });

  /**
   * Đối soát-kéo phải chạy TRƯỚC khi đóng đơn quá hạn: một khoản tiền về muộn
   * trên đơn sắp hết hạn phải được xác nhận, không bị `expireStaleOrders` quét đi.
   */
  it("reconciles paid PayOS orders before expiring stale ones", async () => {
    const order: string[] = [];
    mocks.reconcilePaid.mockImplementation(async () => {
      order.push("reconcile");
      return { scanned: 0, confirmed: 0, review: 0 };
    });
    mocks.expire.mockImplementation(async () => {
      order.push("expire");
      return { scanned: 0, expired: 0, released: 0 };
    });

    await GET(authorized());
    expect(order).toEqual(["reconcile", "expire"]);
  });

  /** Một lỗi ở bước đối soát không được làm hỏng cả lượt cron. */
  it("still completes the cron when reconciliation throws", async () => {
    mocks.reconcilePaid.mockRejectedValue(new Error("PayOS down"));

    const response = await GET(authorized());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      reclaimedOrders: { scanned: 0, confirmed: 0, review: 0 },
    });
    expect(mocks.expire).toHaveBeenCalledOnce();
  });
});
