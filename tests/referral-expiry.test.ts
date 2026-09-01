import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Vòng đời của một khoản credits sau khi nó đã được ghi sổ: nằm im bảy ngày,
 * dùng được sáu tháng, rồi bị xóa sổ đúng phần chưa tiêu.
 *
 * `expireCredits` là chỗ dễ mất tiền nhất của cả tính năng, theo cả hai chiều:
 * xóa sổ thiếu thì HDI gánh một khoản nợ không bao giờ đóng, xóa sổ thừa thì
 * học viên mất credits họ đã tiêu rồi. Sổ không gắn khoản chi với khoản thu
 * nào, nên đúng/sai ở đây nằm hoàn toàn trong phép trừ ba tổng.
 */
const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  aggregate: vi.fn(),
  create: vi.fn(),
  count: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referralLedger: { findMany: mocks.findMany },
    $transaction: mocks.transaction,
  },
}));

import { creditBalanceVnd, expireCredits } from "@/lib/referral-ledger";

const NOW = new Date("2026-09-01T00:00:00.000Z");

/**
 * Dựng một cái ví: `matured` là hoa hồng đã tới hạn, `spent` là số đã tiêu,
 * `writtenOff` là phần đã xóa sổ ở những lần chạy trước, `balance` là số dư
 * hiện tại. Ba tổng đầu đúng bằng E, S, W trong công thức.
 */
function wallet(input: {
  matured: number;
  spent: number;
  writtenOff: number;
  balance: number;
}) {
  mocks.findMany.mockResolvedValue([{ userId: "user-1" }]);
  mocks.aggregate.mockImplementation(
    async ({ where }: { where: { type?: string; expiresAt?: unknown } }) => {
      if (where.type === "commission") {
        return { _sum: { amountVnd: input.matured } };
      }
      if (where.type === "redemption") return { _sum: { amountVnd: -input.spent } };
      if (where.type === "expiry") return { _sum: { amountVnd: -input.writtenOff } };
      // Lời gọi không mang `type` là phép tính số dư của `creditBalanceVnd`.
      return { _sum: { amountVnd: input.balance } };
    },
  );
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      $queryRaw: mocks.queryRaw,
      referralLedger: {
        aggregate: mocks.aggregate,
        create: mocks.create,
        count: mocks.count,
      },
    }),
  );
}

function writtenRow() {
  return mocks.create.mock.calls[0]?.[0].data as {
    type: string;
    amountVnd: number;
    status: string;
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.queryRaw.mockResolvedValue([{ id: "user-1" }]);
  mocks.create.mockResolvedValue({ id: "entry-1" });
});

describe("số dư credits", () => {
  it("chỉ cộng khoản đã qua thời gian giữ", async () => {
    const aggregate = vi.fn().mockResolvedValue({ _sum: { amountVnd: 90_000 } });
    await creditBalanceVnd(
      { referralLedger: { aggregate } } as never,
      "user-1",
      NOW,
    );

    // Điều kiện này LÀ công thức số dư. Một hàng `redemption` để `availableAt`
    // trống nên luôn lọt qua — khoản đã tiêu không bao giờ được biến mất.
    expect(aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          OR: [{ availableAt: null }, { availableAt: { lte: NOW } }],
        }),
      }),
    );
  });
});

describe("xóa sổ credits quá hạn", () => {
  it("xóa sổ đúng phần chưa tiêu", async () => {
    // Nhận 100.000, tiêu 40.000, chưa xóa sổ lần nào → còn 60.000 quá hạn.
    wallet({ matured: 100_000, spent: 40_000, writtenOff: 0, balance: 60_000 });

    await expect(expireCredits(NOW)).resolves.toEqual({
      users: 1,
      totalVnd: 60_000,
    });
    expect(writtenRow()).toMatchObject({
      type: "expiry",
      status: "posted",
      amountVnd: -60_000,
    });
  });

  /**
   * Giả định FIFO: khoản cũ tiêu trước. Một người đã tiêu hết phần quá hạn thì
   * không còn gì để thu hồi — xóa sổ thêm ở đây là trừ họ hai lần cùng một
   * đồng, và sổ này không có gì khác canh chuyện đó.
   */
  it("không xóa sổ gì khi phần quá hạn đã tiêu hết", async () => {
    wallet({ matured: 100_000, spent: 120_000, writtenOff: 0, balance: 30_000 });

    await expect(expireCredits(NOW)).resolves.toEqual({ users: 0, totalVnd: 0 });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("không xóa sổ lại phần đã xóa sổ ở lần chạy trước", async () => {
    wallet({ matured: 100_000, spent: 0, writtenOff: 100_000, balance: 0 });

    await expect(expireCredits(NOW)).resolves.toEqual({ users: 0, totalVnd: 0 });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  /**
   * Số dư có thể đang thấp hơn phần quá hạn vì một đơn chưa thanh toán đang giữ
   * chỗ. Xóa sổ theo E − S − W mà không kẹp sẽ đẩy số dư xuống âm, và người
   * dùng mở trang tài khoản ra thấy mình đang nợ HDI.
   */
  it("không bao giờ đẩy số dư xuống âm", async () => {
    wallet({ matured: 100_000, spent: 0, writtenOff: 0, balance: 20_000 });

    await expect(expireCredits(NOW)).resolves.toEqual({
      users: 1,
      totalVnd: 20_000,
    });
    expect(writtenRow().amountVnd).toBe(-20_000);
  });

  it("khóa hàng user trước khi đọc số dư của họ", async () => {
    wallet({ matured: 100_000, spent: 0, writtenOff: 0, balance: 100_000 });

    await expireCredits(NOW);

    // `createOrder` đang đọc chính số dư này để quyết định trừ bao nhiêu
    // credits; không khóa thì hai bên cùng tiêu một khoản.
    expect(mocks.queryRaw).toHaveBeenCalled();
  });

  it("không mở transaction nào khi không ai có credits quá hạn", async () => {
    mocks.findMany.mockResolvedValue([]);

    await expect(expireCredits(NOW)).resolves.toEqual({ users: 0, totalVnd: 0 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
