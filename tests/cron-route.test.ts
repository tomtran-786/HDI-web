import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  expire: vi.fn(),
  grants: vi.fn(),
  revokes: vi.fn(),
  throttles: vi.fn(),
  tokens: vi.fn(),
  leases: vi.fn(),
  services: vi.fn(),
}));

vi.mock("@/lib/orders", () => ({ expireStaleOrders: mocks.expire }));
vi.mock("@/lib/service-orders", () => ({
  expireStaleServiceOrders: mocks.services,
}));
vi.mock("@/lib/fulfillment", () => ({
  reconcileMissingDriveGrants: mocks.grants,
  revokeExpiredDriveAccess: mocks.revokes,
}));
vi.mock("@/lib/auth-throttle", () => ({ pruneAuthThrottles: mocks.throttles }));
vi.mock("@/lib/auth-tokens", () => ({ pruneExpiredAuthTokens: mocks.tokens }));
vi.mock("@/lib/external-lease", () => ({ pruneExpiredLeases: mocks.leases }));

import { GET } from "@/app/api/cron/don-hang-het-han/route";

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
  });

  it("returns 404 without the bearer secret and performs no work", async () => {
    const response = await GET(new Request("https://hdi.test/api/cron"));
    expect(response.status).toBe(404);
    for (const mock of Object.values(mocks)) expect(mock).not.toHaveBeenCalled();
  });

  it("runs each bounded housekeeping pass for an authorized request", async () => {
    const response = await GET(
      new Request("https://hdi.test/api/cron", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      orders: { scanned: 0, expired: 0, released: 0 },
      services: { expired: 0 },
      driveGrants: { checked: 0, granted: 0 },
      pruned: { throttles: 0, tokens: 0, leases: 0 },
    });
    for (const mock of Object.values(mocks)) expect(mock).toHaveBeenCalledOnce();
  });
});
