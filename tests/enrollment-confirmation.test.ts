import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { enrollment: { findMany: mocks.findMany, updateMany: mocks.updateMany } },
}));

import { confirmEnrollments } from "@/lib/enrollment";

const PAID_AT = new Date("2026-08-31T10:00:00.000Z");

describe("xác nhận ghi danh theo lô", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.updateMany.mockImplementation(
      async ({ where }: { where: { id: { in: string[] } } }) => ({
        count: where.id.in.length,
      }),
    );
  });

  /**
   * Đây là lý do hàm này tồn tại. Hàm một-dòng cũ tốn HAI truy vấn cho mỗi ghế,
   * và nó chạy bên trong transaction của webhook: một đơn nhóm mười người mua
   * vài khóa đẩy transaction đó vượt hạn của Prisma. Khi nó vượt hạn, cả hàng
   * `payments` vừa ghi cũng rollback theo — tiền đã vào tài khoản mà không để
   * lại dấu vết nào, kể cả trong hàng chờ đối soát.
   */
  it("gộp mọi ghế cùng chính sách hạn truy cập vào một lệnh ghi", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "e1", course: { accessDays: 180 } },
      { id: "e2", course: { accessDays: 180 } },
      { id: "e3", course: { accessDays: 180 } },
    ]);

    await expect(
      confirmEnrollments(["e1", "e2", "e3"], undefined, PAID_AT),
    ).resolves.toEqual({ confirmed: 3 });

    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.updateMany).toHaveBeenCalledTimes(1);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["e1", "e2", "e3"] }, status: "pending" },
      data: {
        status: "paid",
        paidAt: PAID_AT,
        accessExpiresAt: new Date("2027-02-27T10:00:00.000Z"),
      },
    });
  });

  /**
   * `accessDays` là đầu vào duy nhất khác nhau giữa các dòng, nên nó cũng là
   * ranh giới duy nhất buộc phải tách lệnh ghi. `null` nghĩa là không hết hạn,
   * và đó là một nhóm riêng chứ không phải "hết hạn ngay".
   */
  it("tách theo chính sách hạn, và null là một nhóm riêng", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "e1", course: { accessDays: 180 } },
      { id: "e2", course: { accessDays: null } },
      { id: "e3", course: { accessDays: 30 } },
      { id: "e4", course: { accessDays: null } },
    ]);

    await expect(
      confirmEnrollments(["e1", "e2", "e3", "e4"], undefined, PAID_AT),
    ).resolves.toEqual({ confirmed: 4 });

    expect(mocks.updateMany).toHaveBeenCalledTimes(3);
    const noExpiry = mocks.updateMany.mock.calls.find(
      (call) => call[0].data.accessExpiresAt === null,
    );
    expect(noExpiry?.[0].where.id.in).toEqual(["e2", "e4"]);
  });

  /**
   * Cùng ngữ nghĩa idempotency với bản một-dòng: điều kiện `status: "pending"`
   * nằm TRONG lệnh ghi, nên một lượt webhook được PayOS giao lại đếm được 0 và
   * đó là thành công, không phải lỗi.
   */
  it("không đếm những ghế đã được một lượt trước xác nhận", async () => {
    mocks.findMany.mockResolvedValue([{ id: "e1", course: { accessDays: 180 } }]);
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(confirmEnrollments(["e1"])).resolves.toEqual({ confirmed: 0 });
  });

  it("không chạm database khi không có ghế nào", async () => {
    await expect(confirmEnrollments([])).resolves.toEqual({ confirmed: 0 });
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
