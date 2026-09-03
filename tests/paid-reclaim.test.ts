import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `reclaimPaidPayosOrder` / `reclaimPaidPayosServiceOrder` — đường tự chữa khi
 * PayOS KHÔNG gửi webhook. Hỏi thẳng `paymentRequests.get`, và nếu link đã PAID
 * thì dựng lại một `PayosPaymentEvent` từ dòng giao dịch tốt nhất rồi đẩy qua
 * ĐÚNG đường ghi cũ (`processPayosPayment` / `processServicePayment`).
 *
 * Ở đây `prisma.$transaction` được mock để trả kết quả đã dàn sẵn — bài test này
 * canh phần LOGIC RIÊNG của bộ đối soát (chặn theo trạng thái, chọn giao dịch,
 * dựng sự kiện, chuyển `review`), không phải chạy lại toàn bộ `processPayosPayment`
 * (đã có test riêng).
 */

const mocks = vi.hoisted(() => ({
  orderFindFirst: vi.fn(),
  serviceOrderFindFirst: vi.fn(),
  transaction: vi.fn(),
  payosGet: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findFirst: mocks.orderFindFirst },
    serviceOrder: { findFirst: mocks.serviceOrderFindFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/payos", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payos")>("@/lib/payos");
  return {
    ...actual,
    payosClient: () => ({ paymentRequests: { get: mocks.payosGet } }),
    // `NotFoundError` của @payos/node thừa kế constructor 4 tham số bắt buộc —
    // rườm rà để dựng trong test. Nhận diện bằng message sentinel thay thế.
    isPayosNotFound: (e: unknown) =>
      e instanceof Error && e.message === "payos-not-found",
  };
});

import { pickPaidTransaction, reclaimPaidPayosOrder } from "@/lib/orders";
import { reclaimPaidPayosServiceOrder } from "@/lib/service-orders";

const ORDER = {
  id: "order-1",
  code: 100_039,
  amountVnd: 300_000,
  providerRef: "link-1",
  checkoutUrl: "https://pay.payos.vn/web/link-1",
};

function paidLink(overrides: Record<string, unknown> = {}) {
  return {
    id: "link-1",
    orderCode: 100_039,
    amount: 300_000,
    amountPaid: 300_000,
    amountRemaining: 0,
    status: "PAID",
    createdAt: "2026-09-03T16:53:02+07:00",
    transactions: [
      {
        reference: "FT26246100050956",
        amount: 300_000,
        transactionDateTime: "2026-09-03T16:54:10+07:00",
        counterAccountName: null,
        description: "chuyen tien",
      },
    ],
    canceledAt: null,
    cancellationReason: null,
    ...overrides,
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.orderFindFirst.mockResolvedValue({ ...ORDER });
  mocks.serviceOrderFindFirst.mockResolvedValue({ ...ORDER });
  mocks.payosGet.mockResolvedValue(paidLink());
  mocks.transaction.mockResolvedValue({
    handled: true,
    outcome: "succeeded",
    orderId: "order-1",
    fulfill: true,
    reclaimed: false,
  });
});

describe("reclaimPaidPayosOrder", () => {
  it("dựng sự kiện từ giao dịch PAID rồi đẩy qua processPayosPayment", async () => {
    const result = await reclaimPaidPayosOrder("order-1");

    expect(mocks.payosGet).toHaveBeenCalledWith(100_039);
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      confirmed: true,
      outcome: "succeeded",
      orderId: "order-1",
      fulfill: true,
      reclaimed: false,
    });
  });

  it("chọn dòng đúng số tiền và sớm nhất khi có nhiều giao dịch", async () => {
    // `processPayosPayment` được mock, nên bắt sự kiện tổng hợp qua chính
    // `pickPaidTransaction` (test riêng bên dưới); ở đây chỉ cần nó vẫn xác nhận.
    mocks.payosGet.mockResolvedValue(
      paidLink({
        transactions: [
          {
            reference: "NOISE",
            amount: 1_000,
            transactionDateTime: "2026-09-03T10:00:00+07:00",
          },
          {
            reference: "FT-LATE",
            amount: 300_000,
            transactionDateTime: "2026-09-03T17:10:00+07:00",
          },
          {
            reference: "FT-EARLY",
            amount: 300_000,
            transactionDateTime: "2026-09-03T16:54:10+07:00",
          },
        ],
      }),
    );

    const result = await reclaimPaidPayosOrder("order-1");
    expect(result).toMatchObject({ confirmed: true, outcome: "succeeded" });
  });

  it("chuyển `review` ra khi lượt PAID cần người xem (lệch số tiền)", async () => {
    mocks.transaction.mockResolvedValue({
      handled: true,
      outcome: "requires_review",
      orderId: "order-1",
      review: {
        label: "Đơn #100039",
        reason: "Số tiền không khớp",
        expectedVnd: 300_000,
        receivedVnd: 250_000,
        providerRef: "FT26246100050956",
      },
    });

    const result = await reclaimPaidPayosOrder("order-1");
    expect(result).toMatchObject({
      confirmed: true,
      outcome: "requires_review",
      review: expect.objectContaining({ reason: "Số tiền không khớp" }),
    });
  });

  it("idempotency: lượt gửi lại đọc là `duplicate`, không flip đơn lần hai", async () => {
    mocks.transaction.mockResolvedValue({
      handled: true,
      outcome: "duplicate",
      orderId: "order-1",
      fulfill: false,
    });

    const result = await reclaimPaidPayosOrder("order-1");
    expect(result).toMatchObject({ confirmed: true, outcome: "duplicate", fulfill: false });
  });

  it("PROCESSING/UNDERPAID vẫn thuộc webhook — không tự dựng sự kiện", async () => {
    for (const status of ["PROCESSING", "UNDERPAID"]) {
      mocks.transaction.mockClear();
      mocks.payosGet.mockResolvedValue(paidLink({ status }));

      const result = await reclaimPaidPayosOrder("order-1");
      expect(result).toEqual({ confirmed: false, reason: status });
      expect(mocks.transaction).not.toHaveBeenCalled();
    }
  });

  it("PAID nhưng không có giao dịch dùng được — bất thường, có log, không dựng", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.payosGet.mockResolvedValue(paidLink({ transactions: [] }));

    const result = await reclaimPaidPayosOrder("order-1");
    expect(result).toEqual({ confirmed: false, reason: "paid_no_transaction" });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("`.get()` báo not-found → gateway_unavailable, không dựng", async () => {
    mocks.payosGet.mockRejectedValue(new Error("payos-not-found"));

    const result = await reclaimPaidPayosOrder("order-1");
    expect(result).toEqual({ confirmed: false, reason: "gateway_unavailable" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("đơn không còn `pending` → trả sớm, không hỏi PayOS", async () => {
    mocks.orderFindFirst.mockResolvedValue(null);

    const result = await reclaimPaidPayosOrder("order-1");
    expect(result).toEqual({ confirmed: false, reason: "not_pending" });
    expect(mocks.payosGet).not.toHaveBeenCalled();
  });

  it("đơn chưa từng có link PayOS → trả sớm, không hỏi PayOS", async () => {
    mocks.orderFindFirst.mockResolvedValue({
      ...ORDER,
      providerRef: null,
      checkoutUrl: null,
    });

    const result = await reclaimPaidPayosOrder("order-1");
    expect(result).toEqual({ confirmed: false, reason: "no_remote_link" });
    expect(mocks.payosGet).not.toHaveBeenCalled();
  });
});

describe("pickPaidTransaction", () => {
  const t = (
    reference: string,
    amount: number,
    transactionDateTime: string,
  ) => ({ reference, amount, transactionDateTime });

  it("ưu tiên dòng đúng số tiền, và trong nhóm đó lấy dòng sớm nhất", () => {
    const chosen = pickPaidTransaction(
      [
        t("late", 300_000, "2026-09-03T17:10:00+07:00"),
        t("early", 300_000, "2026-09-03T16:54:10+07:00"),
        t("wrong", 999_999, "2026-09-03T16:00:00+07:00"),
      ],
      300_000,
    );
    expect(chosen?.reference).toBe("early");
  });

  it("không có dòng nào khớp số tiền → lấy dòng lớn nhất", () => {
    const chosen = pickPaidTransaction(
      [
        t("small", 50_000, "2026-09-03T16:00:00+07:00"),
        t("big", 250_000, "2026-09-03T16:30:00+07:00"),
      ],
      300_000,
    );
    expect(chosen?.reference).toBe("big");
  });

  it("loại dòng không đọc được thời điểm giao dịch và dòng thiếu reference", () => {
    expect(
      pickPaidTransaction(
        [
          t("", 300_000, "2026-09-03T16:54:10+07:00"),
          t("bad-date", 300_000, "khong-phai-ngay"),
        ],
        300_000,
      ),
    ).toBeNull();
  });

  it("chuỗi ISO kèm +07:00 vẫn parse được (định dạng của paymentRequests.get)", () => {
    const chosen = pickPaidTransaction(
      [t("iso", 300_000, "2026-09-03T16:54:10+07:00")],
      300_000,
    );
    expect(chosen?.reference).toBe("iso");
  });

  it("danh sách rỗng → null", () => {
    expect(pickPaidTransaction([], 300_000)).toBeNull();
  });
});

describe("reclaimPaidPayosServiceOrder", () => {
  it("đẩy qua processServicePayment khi link đã PAID", async () => {
    mocks.transaction.mockResolvedValue({
      handled: true,
      outcome: "succeeded",
      serviceOrderId: "order-1",
    });

    const result = await reclaimPaidPayosServiceOrder("order-1");
    expect(mocks.payosGet).toHaveBeenCalledWith(100_039);
    expect(result).toMatchObject({
      confirmed: true,
      outcome: "succeeded",
      serviceOrderId: "order-1",
    });
  });

  it("không dựng sự kiện khi link chưa PAID", async () => {
    mocks.payosGet.mockResolvedValue(paidLink({ status: "PENDING" }));

    const result = await reclaimPaidPayosServiceOrder("order-1");
    expect(result).toEqual({ confirmed: false, reason: "PENDING" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
