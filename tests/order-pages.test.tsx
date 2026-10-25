import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cartPage, paymentResultPage } from "@/content/checkout";
import { orderLines, orderMoney } from "@/lib/order-lines";

class NotFoundSignal extends Error {}
class RedirectSignal extends Error {}

const mocks = vi.hoisted(() => ({
  currentSession: vi.fn(),
  orderFindFirst: vi.fn(),
  syncPayosOrderStatus: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/current-session", () => ({ currentSession: mocks.currentSession }));
vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findFirst: mocks.orderFindFirst } },
}));
vi.mock("@/lib/orders", () => ({
  syncPayosOrderStatus: mocks.syncPayosOrderStatus,
}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
// Client component kéo theo server action (NextAuth/Prisma thật); trang chỉ cần
// biết nó được đặt ở đâu.
vi.mock("@/app/tai-khoan/don-hang/[code]/cancel", () => ({
  CancelOrder: () => <button type="button">CANCEL_SENTINEL</button>,
}));
vi.mock("@/app/tai-khoan/don-hang/[code]/retry", () => ({
  RetryPayment: () => <button type="button">RETRY_SENTINEL</button>,
}));
vi.mock("@/components/payment-poll", () => ({
  PaymentPoll: () => <p>POLL_SENTINEL</p>,
}));

import OrderDetailPage from "@/app/tai-khoan/don-hang/[code]/page";
import PaymentResultPage from "@/app/thanh-toan/ket-qua/page";

const USER = "user-1";
const TIEULUAN = { code: "TIEULUAN", slug: "training-tieu-luan-nckh-kltn" };

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    code: 100042,
    status: "pending",
    amountVnd: 270_000,
    referralDiscountVnd: 30_000,
    creditAppliedVnd: 0,
    createdAt: new Date("2026-10-20T03:00:00Z"),
    expiresAt: new Date("2026-10-20T09:00:00Z"),
    paidAt: null,
    checkoutUrl: "https://pay.payos.test/abc",
    groupSize: 1,
    items: [
      {
        id: "i1",
        priceVnd: 300_000,
        memberUserId: USER,
        member: { email: "me@example.com" },
        course: TIEULUAN,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.notFound.mockImplementation(() => {
    throw new NotFoundSignal();
  });
  mocks.redirect.mockImplementation((path: string) => {
    throw new RedirectSignal(path);
  });
  mocks.currentSession.mockResolvedValue({ user: { id: USER } });
  mocks.syncPayosOrderStatus.mockResolvedValue({ closed: false });
});

const result = async (query: Record<string, string> = { orderCode: "100042" }) =>
  renderToStaticMarkup(
    await PaymentResultPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(query),
    }),
  );
const detail = async (code = "100042") =>
  renderToStaticMarkup(
    await OrderDetailPage({ params: Promise.resolve({ code }), searchParams: Promise.resolve({}) }),
  );

describe("orderLines / orderMoney", () => {
  it("gộp các ghế cùng khóa của đơn nhóm thành một dòng, giá lấy từ snapshot", () => {
    const lines = orderLines(
      [
        { priceVnd: 250_000, memberUserId: "a", member: { email: "a@x.vn" }, course: TIEULUAN },
        { priceVnd: 250_000, memberUserId: "b", member: { email: "b@x.vn" }, course: TIEULUAN },
        { priceVnd: 250_000, memberUserId: "c", member: { email: "c@x.vn" }, course: TIEULUAN },
      ],
      "a",
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      code: "TIEULUAN",
      unitVnd: 250_000,
      learners: 3,
      members: ["bạn", "b@x.vn", "c@x.vn"],
    });
    expect(lines[0].cover).toBeDefined();
    expect(lines[0].schedule).toContain("2026");
  });

  it("khóa không còn trong nội dung vẫn có dòng, không ảnh, tên rơi về slug", () => {
    const [line] = orderLines([
      { priceVnd: 100_000, course: { code: "CU", slug: "khoa-da-xoa" } },
    ]);
    expect(line.title).toBe("khoa-da-xoa");
    expect(line.cover).toBeUndefined();
  });

  it("tạm tính = tổng cuối + các khoản trừ ở mức đơn", () => {
    expect(
      orderMoney({ amountVnd: 270_000, referralDiscountVnd: 30_000, creditAppliedVnd: 0 }),
    ).toMatchObject({ subtotalVnd: 300_000, totalVnd: 270_000 });
    expect(
      orderMoney({ amountVnd: 200_000, referralDiscountVnd: 30_000, creditAppliedVnd: 70_000 }).subtotalVnd,
    ).toBe(300_000);
  });
});

describe("/thanh-toan/ket-qua", () => {
  it("đơn đang chờ: header Trang chủ › Giỏ hàng › Thanh toán, khóa trong đơn, poll và badge", async () => {
    mocks.orderFindFirst.mockResolvedValue(order());
    const html = await result();

    expect(html).toMatch(/<h1[^>]*>Thanh toán<\/h1>/);
    expect(html).toContain('href="/gio-hang"');
    expect(html).toContain(paymentResultPage.header.order(100042));
    expect(html).toContain(paymentResultPage.waiting.title);
    expect(html).toContain(paymentResultPage.badge.waiting);
    expect(html).toContain("Viết tiểu luận");
    expect(html).toContain(cartPage.summaryTitle);
    expect(html).toContain("POLL_SENTINEL");
    expect(html).toContain(paymentResultPage.viewOrder(100042));
    expect(html).toContain('href="/tai-khoan/don-hang/100042"');
  });

  it("các dòng tiền lấy từ đơn: tạm tính, giảm giới thiệu, tổng", async () => {
    mocks.orderFindFirst.mockResolvedValue(order());
    const html = await result();

    expect(html).toContain("300.000");
    expect(html).toContain("−30.000");
    expect(html).toContain("270.000");
  });

  it("đã thanh toán: không poll, nút vào khu vực học viên", async () => {
    mocks.orderFindFirst.mockResolvedValue(order({ status: "paid" }));
    const html = await result();

    expect(html).toContain(paymentResultPage.paid.title);
    expect(html).toContain(paymentResultPage.badge.paid);
    expect(html).not.toContain("POLL_SENTINEL");
    expect(html).toContain('href="/tai-khoan"');
    expect(mocks.syncPayosOrderStatus).not.toHaveBeenCalled();
  });

  it("đơn PayOS đã đóng thì nói đúng trạng thái đóng, không hứa xác nhận", async () => {
    mocks.orderFindFirst.mockResolvedValue(order());
    mocks.syncPayosOrderStatus.mockResolvedValue({ closed: true, as: "cancelled", released: 1 });
    const html = await result();

    expect(html).toContain(paymentResultPage.closed.cancelled);
    expect(html).toContain(paymentResultPage.badge.closed);
    expect(html).not.toContain("POLL_SENTINEL");
    expect(html).not.toContain(paymentResultPage.waiting.title);
  });

  it("chưa đăng nhập đi qua cổng đăng nhập, đơn của người khác là 404", async () => {
    mocks.currentSession.mockResolvedValue(null);
    await expect(result()).rejects.toBeInstanceOf(RedirectSignal);

    mocks.currentSession.mockResolvedValue({ user: { id: USER } });
    mocks.orderFindFirst.mockResolvedValue(null);
    await expect(result()).rejects.toBeInstanceOf(NotFoundSignal);
    expect(mocks.orderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 100042, userId: USER } }),
    );
  });
});

describe("/tai-khoan/don-hang/[code]", () => {
  it("đơn đang chờ: tóm tắt chứa đồng hồ giữ chỗ, link PayOS và nút hủy", async () => {
    mocks.orderFindFirst.mockResolvedValue(order());
    const html = await detail();

    expect(html).toMatch(/<h1[^>]*>Mã đơn #100042<\/h1>/);
    expect(html).toContain('href="/tai-khoan/don-hang"');
    expect(html).toContain("Giữ chỗ đến");
    expect(html).toContain('href="https://pay.payos.test/abc"');
    expect(html).toContain("CANCEL_SENTINEL");
    expect(html).not.toContain("RETRY_SENTINEL");
    // Không có thanh breadcrumb thứ hai: đầu trang đã tự có.
    expect(html.match(/aria-label="Breadcrumb"/g)).toHaveLength(1);
  });

  it("chưa có link PayOS thì hiện nút thử tạo lại và Zalo", async () => {
    mocks.orderFindFirst.mockResolvedValue(order({ checkoutUrl: null }));
    const html = await detail();

    expect(html).toContain("RETRY_SENTINEL");
    expect(html).toContain("zalo.me");
    expect(html).not.toContain("Thanh toán với PayOS");
  });

  it("đơn nhóm: một dòng mỗi khóa, số người học và danh sách thành viên", async () => {
    mocks.orderFindFirst.mockResolvedValue(
      order({
        groupSize: 3,
        amountVnd: 750_000,
        referralDiscountVnd: 0,
        items: ["me", "b", "c"].map((who, i) => ({
          id: `i${i}`,
          priceVnd: 250_000,
          memberUserId: who === "me" ? USER : who,
          member: { email: `${who}@x.vn` },
          course: TIEULUAN,
        })),
      }),
    );
    const html = await detail();

    expect(html.match(/Viết tiểu luận/g)).toHaveLength(1);
    expect(html).toContain("Số người học: ");
    expect(html).toContain("Nhóm 3 người");
    expect(html).toContain("bạn, b@x.vn, c@x.vn");
    expect(html).toContain("750.000");
  });

  it("đơn đã thanh toán: không đồng hồ, không nút hủy, có lối vào tài khoản", async () => {
    mocks.orderFindFirst.mockResolvedValue(order({ status: "paid" }));
    const html = await detail();

    expect(html).not.toContain("CANCEL_SENTINEL");
    expect(html).not.toContain("Giữ chỗ đến");
    expect(html).toContain("Vào trang tài khoản");
  });

  it("đơn của người khác hoặc mã không phải số là 404", async () => {
    mocks.orderFindFirst.mockResolvedValue(null);
    await expect(detail()).rejects.toBeInstanceOf(NotFoundSignal);
    await expect(detail("abc")).rejects.toBeInstanceOf(NotFoundSignal);
  });
});
