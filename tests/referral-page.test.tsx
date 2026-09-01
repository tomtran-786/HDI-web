import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  COMMISSION_HOLD_DAYS,
  CREDIT_MAX_SHARE_PCT,
  REWARDED_REFERRALS_MAX,
} from "@/lib/referral-pricing";

const mocks = vi.hoisted(() => ({
  currentSession: vi.fn(),
  ensureReferralCode: vi.fn(),
  ledgerAggregate: vi.fn(),
  ledgerFindMany: vi.fn(),
  ledgerCount: vi.fn(),
  userCount: vi.fn(),
}));

vi.mock("@/lib/current-session", () => ({
  currentSession: mocks.currentSession,
}));
vi.mock("@/lib/referral-code", () => ({
  ensureReferralCode: mocks.ensureReferralCode,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: mocks.userCount },
    referralLedger: {
      aggregate: mocks.ledgerAggregate,
      findMany: mocks.ledgerFindMany,
      count: mocks.ledgerCount,
    },
  },
}));

import ReferralPage from "@/app/tai-khoan/gioi-thieu/page";

const NOW = Date.now();

function render() {
  return ReferralPage().then((element) => renderToStaticMarkup(element));
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
  mocks.ensureReferralCode.mockResolvedValue("HDI7K2");
  mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 250_000 } });
  mocks.ledgerFindMany.mockResolvedValue([]);
  mocks.ledgerCount.mockResolvedValue(2);
  mocks.userCount.mockResolvedValue(3);
});

describe("trang giới thiệu bạn bè", () => {
  it("dẫn người đọc qua đủ năm bước của chương trình", async () => {
    const html = await render();

    expect(html).toContain("Cách hoạt động");
    expect(html).toContain("Chia sẻ mã hoặc link mời của bạn");
    expect(html).toContain(`Sau ${COMMISSION_HOLD_DAYS} ngày, credits vào ví của bạn`);
    expect(html).toContain("HDI7K2");
    expect(html).toContain("dang-ky-tai-khoan?ref=HDI7K2");
  });

  /**
   * Người bạn được mời phải nhập mã NGAY lúc đăng ký — sau đó không gắn lại
   * được. Khối minh họa tồn tại chỉ vì điều đó, nên nó phải luôn có mặt.
   */
  it("chỉ đúng ô nhập mã trên form đăng ký, kèm mã thật của người dùng", async () => {
    const html = await render();

    expect(html).toContain("Bạn của bạn nhập mã ở đâu");
    expect(html).toContain("TẠI ĐÂY");
    expect(html).toContain("Mã giới thiệu (nếu có)");
  });

  it("tách credits khả dụng khỏi phần đang chờ", async () => {
    const html = await render();

    expect(html).toContain("Credits khả dụng");
    expect(html).toContain("Đang chờ");
    expect(html).toContain("Bạn bè đã đăng ký");
    expect(html).toContain("Lượt thưởng còn lại");
    // Đã thưởng 2 trong 6 tháng → còn 3 trên tổng 5.
    expect(html).toContain(`3/${REWARDED_REFERRALS_MAX}`);
  });

  it("nói hết giới hạn của chính sách trong phần điều khoản", async () => {
    const html = await render();

    expect(html).toContain("Người được giới thiệu");
    expect(html).toContain("Người giới thiệu");
    expect(html).toContain("Giới hạn");
    expect(html).toContain("Không cộng dồn với giảm giá nhóm");
    expect(html).toContain(`tối đa ${CREDIT_MAX_SHARE_PCT}% học phí`);
    expect(html).toContain(
      `Tối đa ${REWARDED_REFERRALS_MAX} lượt giới thiệu được thưởng`,
    );
  });

  /**
   * Một khoản còn trong thời gian giữ CHƯA nằm trong "credits khả dụng", nên nó
   * phải tự nói ra ngày mở khóa — nếu không người đọc cộng tay các dòng trong
   * sổ và ra một con số khác với ô số ở trên.
   */
  it("phân biệt khoản đang giữ với khoản đã dùng được trong lịch sử", async () => {
    mocks.ledgerFindMany.mockResolvedValue([
      {
        id: "entry-held",
        type: "commission",
        status: "posted",
        amountVnd: 90_000,
        createdAt: new Date(NOW),
        availableAt: new Date(NOW + 3 * 24 * 3600 * 1000),
        expiresAt: new Date(NOW + 180 * 24 * 3600 * 1000),
      },
      {
        id: "entry-ready",
        type: "commission",
        status: "posted",
        amountVnd: 80_000,
        createdAt: new Date(NOW - 30 * 24 * 3600 * 1000),
        availableAt: new Date(NOW - 23 * 24 * 3600 * 1000),
        expiresAt: new Date(NOW + 150 * 24 * 3600 * 1000),
      },
    ]);

    const html = await render();

    expect(html).toContain("dùng được từ");
    expect(html).toContain("hạn dùng");
  });
});
