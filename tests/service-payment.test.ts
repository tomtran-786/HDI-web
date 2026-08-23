import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentCreate: vi.fn(),
  serviceUpdateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { processServicePayment } from "@/lib/service-orders";

const now = new Date();

function event(overrides: Record<string, unknown> = {}) {
  return {
    orderCode: 900_000_001,
    amount: 70_000,
    currency: "VND",
    reference: "BANK-REF-1",
    paymentLinkId: "link-1",
    transactionDateTime: now.toISOString(),
    code: "00",
    payload: { raw: true },
    ...overrides,
  } as Parameters<typeof processServicePayment>[0];
}

describe("xác nhận thanh toán đơn dịch vụ", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.queryRaw.mockResolvedValue([
      {
        id: "svc-1",
        status: "pending",
        amountVnd: 70_000,
        expiresAt: new Date(now.getTime() + 60_000),
        providerRef: "link-1",
      },
    ]);
    mocks.paymentFindUnique.mockResolvedValue(null);
    mocks.serviceUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: mocks.queryRaw,
        payment: {
          findUnique: mocks.paymentFindUnique,
          create: mocks.paymentCreate,
        },
        serviceOrder: { updateMany: mocks.serviceUpdateMany },
      }),
    );
  });

  it("chuyển đơn sang paid và ghi bằng chứng vào sổ payments chung", async () => {
    await expect(processServicePayment(event())).resolves.toEqual({
      handled: true,
      outcome: "succeeded",
      serviceOrderId: "svc-1",
    });
    expect(mocks.paymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        serviceOrderId: "svc-1",
        provider: "payos",
        providerRef: "BANK-REF-1",
        amountVnd: 70_000,
        status: "succeeded",
      }),
    });
    // Điều kiện `status: "pending"` nằm trong chính lệnh ghi: đó là thứ đóng
    // cửa sổ giữa hai lần webhook gửi cùng lúc.
    expect(mocks.serviceUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "svc-1", status: "pending" },
      }),
    );
  });

  it("mã không thuộc đơn dịch vụ nào thì trả unknown_order, không ghi gì", async () => {
    mocks.queryRaw.mockResolvedValue([]);
    await expect(processServicePayment(event())).resolves.toEqual({
      handled: true,
      outcome: "unknown_order",
    });
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
  });

  it("webhook gửi lại cùng một mã giao dịch không thu tiền lần hai", async () => {
    mocks.paymentFindUnique.mockResolvedValue({
      serviceOrderId: "svc-1",
      status: "succeeded",
    });
    await expect(processServicePayment(event())).resolves.toEqual({
      handled: true,
      outcome: "duplicate",
      serviceOrderId: "svc-1",
    });
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
    expect(mocks.serviceUpdateMany).not.toHaveBeenCalled();
  });

  it("cùng mã giao dịch nhưng gắn đơn khác là xung đột, không phải trùng lặp", async () => {
    // Sổ payments dùng chung cho cả đơn khóa học lẫn đơn dịch vụ, nên nhánh này
    // cũng bắt được một mã ngân hàng đã thuộc về một đơn khóa học.
    mocks.paymentFindUnique.mockResolvedValue({
      serviceOrderId: null,
      status: "succeeded",
    });
    await expect(processServicePayment(event())).resolves.toEqual({
      handled: true,
      outcome: "reference_conflict",
    });
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
  });

  it("sai số tiền thì ghi nhận để kiểm tra tay, không mở đơn", async () => {
    await expect(
      processServicePayment(event({ amount: 35_000 })),
    ).resolves.toMatchObject({ outcome: "requires_review" });
    expect(mocks.paymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "requires_review" }),
    });
    expect(mocks.serviceUpdateMany).not.toHaveBeenCalled();
  });

  it("giao dịch sau hạn đơn không được tự động xác nhận", async () => {
    mocks.queryRaw.mockResolvedValue([
      {
        id: "svc-1",
        status: "pending",
        amountVnd: 70_000,
        expiresAt: new Date(now.getTime() - 60_000),
        providerRef: "link-1",
      },
    ]);
    await expect(processServicePayment(event())).resolves.toMatchObject({
      outcome: "requires_review",
    });
    expect(mocks.serviceUpdateMany).not.toHaveBeenCalled();
  });

  it("mã trả về khác 00 là thất bại, không phải chờ kiểm tra", async () => {
    await expect(
      processServicePayment(event({ code: "01" })),
    ).resolves.toMatchObject({ outcome: "failed" });
    expect(mocks.serviceUpdateMany).not.toHaveBeenCalled();
  });

  it("link thanh toán không khớp thì không xác nhận", async () => {
    await expect(
      processServicePayment(event({ paymentLinkId: "link-la" })),
    ).resolves.toMatchObject({ outcome: "requires_review" });
    expect(mocks.serviceUpdateMany).not.toHaveBeenCalled();
  });
});
