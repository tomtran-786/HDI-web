import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("googleapis", () => ({
  google: {
    auth: { JWT: class {} },
    drive: () => ({
      permissions: {
        list: mocks.list,
        create: mocks.create,
        delete: mocks.remove,
      },
    }),
  },
}));

import {
  grantDrivePermission,
  revokeDrivePermission,
} from "@/lib/google-drive";

describe("Google Drive permissions", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    process.env.GOOGLE_CLIENT_EMAIL = "service@hdi.test";
    process.env.GOOGLE_PRIVATE_KEY = "test-key";
  });

  it("reuses an existing direct permission instead of sharing twice", async () => {
    mocks.list.mockResolvedValue({
      data: {
        permissions: [
          {
            id: "permission-existing",
            emailAddress: "student@example.com",
            permissionDetails: [{ inherited: false }],
          },
        ],
      },
    });

    await expect(
      grantDrivePermission("folder-1", "STUDENT@example.com"),
    ).resolves.toEqual({ success: true, permissionId: "permission-existing" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates a reader permission with shared-drive support when absent", async () => {
    mocks.list.mockResolvedValue({ data: { permissions: [] } });
    mocks.create.mockResolvedValue({ data: { id: "permission-created" } });

    await expect(
      grantDrivePermission("folder-1", "student@example.com"),
    ).resolves.toEqual({ success: true, permissionId: "permission-created" });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: "folder-1",
        supportsAllDrives: true,
        requestBody: {
          role: "reader",
          type: "user",
          emailAddress: "student@example.com",
        },
      }),
    );
  });

  it("removes a replacement permission when the stored id is stale", async () => {
    mocks.remove
      .mockRejectedValueOnce({ code: 404 })
      .mockResolvedValueOnce({ data: {} });
    mocks.list.mockResolvedValue({
      data: {
        permissions: [
          {
            id: "permission-new",
            emailAddress: "student@example.com",
            permissionDetails: [{ inherited: false }],
          },
        ],
      },
    });

    await expect(
      revokeDrivePermission(
        "folder-1",
        "student@example.com",
        "permission-old",
      ),
    ).resolves.toEqual({ success: true, permissionId: "permission-new" });
    expect(mocks.remove).toHaveBeenNthCalledWith(2, {
      fileId: "folder-1",
      permissionId: "permission-new",
      supportsAllDrives: true,
    });
  });
});
