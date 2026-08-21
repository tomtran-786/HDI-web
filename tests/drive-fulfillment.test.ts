import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  orderFindFirst: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
  acquireLease: vi.fn(),
  renew: vi.fn(),
  release: vi.fn(),
  grant: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findFirst: mocks.orderFindFirst },
    enrollment: {
      findMany: mocks.findMany,
      count: mocks.count,
      updateMany: mocks.updateMany,
    },
  },
}));
vi.mock("@/lib/external-lease", () => ({
  acquireExternalLease: mocks.acquireLease,
}));
vi.mock("@/lib/google-drive", () => ({
  grantDrivePermission: mocks.grant,
  revokeDrivePermission: mocks.revoke,
}));

import {
  fulfillOrderDrive,
  reconcileDriveFolder,
  reconcileMissingDriveGrants,
  revokeExpiredDriveAccess,
} from "@/lib/fulfillment";

describe("Drive fulfillment reconciliation", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.acquireLease.mockResolvedValue({ renew: mocks.renew, release: mocks.release });
    mocks.renew.mockResolvedValue(true);
    mocks.release.mockResolvedValue(undefined);
  });

  it("serializes a folder grant and saves the permission id conditionally", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "enrollment-1", user: { email: "student@example.com" } },
    ]);
    mocks.grant.mockResolvedValue({ success: true, permissionId: "permission-1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(reconcileDriveFolder("folder-1")).resolves.toEqual({
      checked: 1,
      granted: 1,
      busy: false,
    });
    expect(mocks.acquireLease).toHaveBeenCalledWith("drive:folder-1");
    expect(mocks.grant).toHaveBeenCalledWith("folder-1", "student@example.com");
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { drivePermissionId: "permission-1" } }),
    );
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("does no external work when another worker holds the folder lease", async () => {
    mocks.acquireLease.mockResolvedValue(null);
    await expect(reconcileDriveFolder("folder-1")).resolves.toEqual({
      checked: 0,
      granted: 0,
      busy: true,
    });
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  it("stops mutating when ownership of a live batch lease is lost", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "enrollment-1", user: { email: "student@example.com" } },
    ]);
    mocks.renew.mockResolvedValue(false);

    await expect(reconcileDriveFolder("folder-1")).resolves.toEqual({
      checked: 1,
      granted: 0,
      busy: false,
    });
    expect(mocks.grant).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("leaves a failed grant missing so a later reconciliation can retry it", async () => {
    const candidate = {
      id: "enrollment-retry",
      user: { email: "student@example.com" },
    };
    mocks.findMany.mockResolvedValue([candidate]);
    mocks.grant
      .mockRejectedValueOnce(new Error("Drive unavailable"))
      .mockResolvedValueOnce({ success: true, permissionId: "permission-retry" });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(reconcileDriveFolder("folder-1")).resolves.toEqual({
      checked: 1,
      granted: 0,
      busy: false,
    });
    expect(mocks.updateMany).not.toHaveBeenCalled();

    await expect(reconcileDriveFolder("folder-1")).resolves.toEqual({
      checked: 1,
      granted: 1,
      busy: false,
    });
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { drivePermissionId: "permission-retry" } }),
    );
  });

  it("targets fulfillment to the paid order instead of sweeping unrelated students", async () => {
    mocks.orderFindFirst.mockResolvedValue({
      items: [
        {
          enrollmentId: "enrollment-order-1",
          cohort: {
            driveFolderId: "folder-1",
            courseSlug: "course",
            ky: "K1",
          },
        },
      ],
    });
    mocks.findMany.mockResolvedValue([
      { id: "enrollment-order-1", user: { email: "student@example.com" } },
    ]);
    mocks.grant.mockResolvedValue({ success: true, permissionId: "permission-1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(fulfillOrderDrive("order-1")).resolves.toEqual({
      folders: 1,
      granted: 1,
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["enrollment-order-1"] },
        }),
        take: 1,
      }),
    );
  });

  it("never exceeds the reconciliation batch budget across folders", async () => {
    mocks.findMany
      .mockResolvedValueOnce([
        { cohort: { driveFolderId: "folder-a" } },
        { cohort: { driveFolderId: "folder-b" } },
      ])
      .mockResolvedValueOnce([
        { id: "enrollment-a1", user: { email: "a1@example.com" } },
        { id: "enrollment-a2", user: { email: "a2@example.com" } },
      ]);
    mocks.grant
      .mockResolvedValueOnce({ success: true, permissionId: "permission-a1" })
      .mockResolvedValueOnce({ success: true, permissionId: "permission-a2" });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(reconcileMissingDriveGrants(2)).resolves.toEqual({
      checked: 2,
      granted: 2,
    });
    expect(mocks.acquireLease).toHaveBeenCalledTimes(1);
    expect(mocks.acquireLease).toHaveBeenCalledWith("drive:folder-a");
    expect(mocks.grant).toHaveBeenCalledTimes(2);
    expect(mocks.findMany).toHaveBeenCalledTimes(2);
  });

  it("keeps a shared permission when another live enrollment needs the folder", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "expired-1",
        userId: "user-1",
        drivePermissionId: "permission-1",
        user: { email: "student@example.com" },
        cohort: { driveFolderId: "folder-1" },
      },
    ]);
    mocks.count.mockResolvedValue(1);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(revokeExpiredDriveAccess()).resolves.toEqual({
      checked: 1,
      revoked: 0,
      kept: 1,
      failed: 0,
    });
    expect(mocks.acquireLease).toHaveBeenCalledWith("drive:folder-1");
    expect(mocks.count).toHaveBeenCalledAfter(mocks.acquireLease);
    expect(mocks.revoke).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("revokes under the folder lease when no other enrollment needs access", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "expired-1",
        userId: "user-1",
        drivePermissionId: "permission-1",
        user: { email: "student@example.com" },
        cohort: { driveFolderId: "folder-1" },
      },
    ]);
    mocks.count.mockResolvedValue(0);
    mocks.revoke.mockResolvedValue({ success: true, permissionId: "permission-1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(revokeExpiredDriveAccess()).resolves.toEqual({
      checked: 1,
      revoked: 1,
      kept: 0,
      failed: 0,
    });
    expect(mocks.revoke).toHaveBeenCalledWith(
      "folder-1",
      "student@example.com",
      "permission-1",
    );
    expect(mocks.release).toHaveBeenCalledOnce();
  });
});
