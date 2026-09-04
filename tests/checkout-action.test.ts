import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
  findUnique: vi.fn(),
  readCartIds: vi.fn(),
  markCheckoutHandoff: vi.fn(),
  writeCartIds: vi.fn(),
  createOrder: vi.fn(),
  cancelOrder: vi.fn(),
  resolveGroupMembers: vi.fn(),
  ensurePayosCheckout: vi.fn(),
  allowUserAction: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/cart", () => ({
  readCartIds: mocks.readCartIds,
  writeCartIds: mocks.writeCartIds,
}));
vi.mock("@/lib/orders", () => ({
  createOrder: mocks.createOrder,
  cancelOrder: mocks.cancelOrder,
}));
vi.mock("@/lib/group-members", async (importOriginal) => ({
  // `normalizeMemberEmails` là hàm thuần, để chạy thật; chỉ chặn phần tra database.
  ...(await importOriginal<typeof import("@/lib/group-members")>()),
  resolveGroupMembers: mocks.resolveGroupMembers,
}));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("@/lib/payment-checkout", () => ({
  ensurePayosCheckout: mocks.ensurePayosCheckout,
}));
vi.mock("@/lib/checkout-handoff", () => ({
  markCheckoutHandoff: mocks.markCheckoutHandoff,
}));

import { checkout } from "@/app/actions/checkout";

describe("one-step cart checkout action", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.redirect.mockImplementation((url: string) => {
      throw new RedirectSignal(url);
    });
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", email: "leader@hdi.test" },
    });
    mocks.resolveGroupMembers.mockResolvedValue({ members: [], unregistered: [] });
    // Cùng một `prisma.user.findUnique` phục vụ hai việc: `currentProfile` tra
    // theo id, còn nhánh mã giới thiệu tra theo `referralCode`.
    mocks.findUnique.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) =>
        "referralCode" in where
          ? { id: "user-referrer" }
          : { phone: "0900000000", stage: "other" },
    );
    mocks.readCartIds.mockResolvedValue(["course-b", "course-a"]);
    mocks.allowUserAction.mockResolvedValue(true);
  });

  it("passes the complete cookie basket to server pricing and redirects to PayOS", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      expiresAt: new Date(),
    });
    mocks.ensurePayosCheckout.mockResolvedValue({
      ok: true,
      state: "ready",
      checkoutUrl: "https://payos.test/checkout",
    });
    const forged = new FormData();
    forged.set("amountVnd", "1");
    forged.set("courseId", "attacker-course");

    await expect(checkout({}, forged)).rejects.toMatchObject({
      url: "https://payos.test/checkout",
    });
    expect(mocks.createOrder).toHaveBeenCalledWith(
      "user-1",
      ["course-b", "course-a"],
      { members: [], useCredit: false, referrerId: undefined },
    );
    expect(mocks.writeCartIds).toHaveBeenCalledWith([]);
    // Dấu bàn giao phải được đặt TRƯỚC khi rời đi: sau `redirect` không còn
    // Server Function nào chạy, nên đây là cơ hội duy nhất, và không có nó thì
    // không ai thu hồi được phiên thanh toán bị bỏ dở.
    expect(mocks.markCheckoutHandoff).toHaveBeenCalledWith({
      kind: "order",
      key: "100001",
    });
  });

  it("chuyển tiếp mã đơn đang chặn ra giỏ hàng, để lời từ chối có đường đi tiếp", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: false,
      reason: "already_enrolled",
      message: "Bạn đang có quyền hoặc đơn chờ thanh toán cho khóa X.",
      pendingOrderCode: 100042,
    });

    await expect(checkout({}, new FormData())).resolves.toEqual({
      error: "Bạn đang có quyền hoặc đơn chờ thanh toán cho khóa X.",
      refreshCatalog: true,
      pendingOrderCode: 100042,
    });
  });

  it("không đặt dấu bàn giao khi PayOS chưa trả về link", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      expiresAt: new Date(),
    });
    mocks.ensurePayosCheckout.mockResolvedValue({
      ok: false,
      state: "pending_gateway",
      message: "PayOS đã nhận đơn nhưng chưa trả lại đường dẫn.",
    });

    await expect(checkout({}, new FormData())).rejects.toMatchObject({
      url: "/tai-khoan/don-hang/100001",
    });
    // Trình duyệt không hề sang PayOS, nên không có phiên nào để thu hồi — và
    // một dấu thừa ở đây sẽ hủy oan đơn ngay lần tải trang kế tiếp.
    expect(mocks.markCheckoutHandoff).not.toHaveBeenCalled();
  });

  it("keeps the basket and returns a modal error when any course fails", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: false,
      reason: "no_seats",
      message: "Một khóa đã hết chỗ.",
    });

    await expect(checkout({}, new FormData())).resolves.toEqual({
      error: "Một khóa đã hết chỗ.",
      refreshCatalog: true,
    });
    expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
    expect(mocks.writeCartIds).not.toHaveBeenCalled();
  });

  it("falls back to the existing order when PayOS has no URL yet", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      expiresAt: new Date(),
    });
    mocks.ensurePayosCheckout.mockResolvedValue({
      ok: false,
      state: "pending_gateway",
      message: "PayOS chưa trả URL.",
    });

    await expect(checkout({}, new FormData())).rejects.toMatchObject({
      url: "/tai-khoan/don-hang/100001",
    });
    expect(mocks.writeCartIds).toHaveBeenCalledWith([]);
  });
  it("từ chối trước khi khóa hàng nào khi người dùng bấm đặt đơn quá nhiều lần", async () => {
    mocks.allowUserAction.mockResolvedValue(false);

    const state = await checkout({}, new FormData());

    expect(state.error).toMatch(/quá nhiều lần/);
    expect(state.refreshCatalog).toBe(true);
    // Điểm mấu chốt: từ chối phải xảy ra TRƯỚC createOrder, nếu không thì mỗi
    // lần bấm vẫn khóa hàng courses và tạo enrolment rồi mới bị chặn.
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
  });

  it("phân giải email thành viên rồi truyền xuống server pricing", async () => {
    mocks.resolveGroupMembers.mockResolvedValue({
      members: [
        { id: "user-2", email: "b@hdi.test" },
        { id: "user-3", email: "c@hdi.test" },
      ],
      unregistered: [],
    });
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 750_000,
      groupSize: 3,
      expiresAt: new Date(),
    });
    mocks.ensurePayosCheckout.mockResolvedValue({
      ok: true,
      state: "ready",
      checkoutUrl: "https://payos.test/checkout",
    });

    const form = new FormData();
    form.append("thanhVien", "b@hdi.test");
    form.append("thanhVien", "c@hdi.test");
    form.set("tongTienDuKien", "750000");

    await expect(checkout({}, form)).rejects.toMatchObject({
      url: "https://payos.test/checkout",
    });
    expect(mocks.createOrder).toHaveBeenCalledWith(
      "user-1",
      ["course-b", "course-a"],
      {
        members: [
          { id: "user-2", email: "b@hdi.test" },
          { id: "user-3", email: "c@hdi.test" },
        ],
        useCredit: false,
        referrerId: undefined,
      },
    );
  });

  describe("mã giới thiệu nhập ở giỏ hàng", () => {
    beforeEach(() => {
      mocks.createOrder.mockResolvedValue({
        ok: true,
        orderId: "order-1",
        code: 100001,
        amountVnd: 900_000,
        expiresAt: new Date(),
      });
      mocks.ensurePayosCheckout.mockResolvedValue({
        ok: true,
        state: "ready",
        checkoutUrl: "https://payos.test/checkout",
      });
    });

    it("phân giải mã hợp lệ và truyền referrerId xuống createOrder", async () => {
      const form = new FormData();
      form.set("maGioiThieu", "skgaxbzr");

      await expect(checkout({}, form)).rejects.toMatchObject({
        url: "https://payos.test/checkout",
      });
      expect(mocks.findUnique).toHaveBeenCalledWith({
        where: { referralCode: "SKGAXBZR" },
        select: { id: true },
      });
      expect(mocks.createOrder).toHaveBeenCalledWith(
        "user-1",
        ["course-b", "course-a"],
        { members: [], useCredit: false, referrerId: "user-referrer" },
      );
    });

    it("trả lỗi và KHÔNG tạo đơn khi mã không tồn tại", async () => {
      mocks.findUnique.mockImplementation(
        async ({ where }: { where: Record<string, unknown> }) =>
          "referralCode" in where
            ? null
            : { phone: "0900000000", stage: "other" },
      );
      const form = new FormData();
      form.set("maGioiThieu", "KHONGCO");

      const result = await checkout({}, form);
      expect(result).toEqual({
        error: expect.stringContaining("Mã giới thiệu không tồn tại"),
        refreshCatalog: false,
      });
      expect(mocks.createOrder).not.toHaveBeenCalled();
    });

    it("trả lỗi khi người mua nhập mã của chính mình", async () => {
      mocks.findUnique.mockImplementation(
        async ({ where }: { where: Record<string, unknown> }) =>
          "referralCode" in where
            ? { id: "user-1" }
            : { phone: "0900000000", stage: "other" },
      );
      const form = new FormData();
      form.set("maGioiThieu", "TUCHINHMINH");

      const result = await checkout({}, form);
      expect(result.error).toContain("của chính mình");
      expect(mocks.createOrder).not.toHaveBeenCalled();
    });

    /**
     * BÀI KIỂM QUYẾT ĐỊNH của thứ tự hai cổng hạn mức.
     *
     * Cổng `checkout` TIÊU một lượt mỗi lần gọi và chỉ có mười lượt một giờ; nó
     * tồn tại để bảo vệ việc khóa dòng courses và lượt gọi PayOS. Một mã gõ sai
     * chưa chạm tới thứ nào trong hai thứ đó. Để nó đốt lượt thì mười lần chép
     * nhầm một ký tự — đúng kiểu hỏng mà bảng chữ cái của `lib/referral-code.ts`
     * được thiết kế quanh nó — sẽ chặn người mua khỏi thanh toán suốt một giờ.
     */
    it("mã sai KHÔNG đốt lượt của cổng hạn mức checkout", async () => {
      mocks.findUnique.mockImplementation(
        async ({ where }: { where: Record<string, unknown> }) =>
          "referralCode" in where
            ? null
            : { phone: "0900000000", stage: "other" },
      );
      const form = new FormData();
      form.set("maGioiThieu", "KHONGCO");

      await checkout({}, form);

      const actions = mocks.allowUserAction.mock.calls.map((call) => call[0]);
      expect(actions).toContain("referral_code");
      expect(actions).not.toContain("checkout");
    });

    it("mã hợp lệ mới tiêu lượt checkout, và tiêu sau cổng riêng của ô mã", async () => {
      const form = new FormData();
      form.set("maGioiThieu", "SKGAXBZR");

      await expect(checkout({}, form)).rejects.toMatchObject({
        url: "https://payos.test/checkout",
      });

      const actions = mocks.allowUserAction.mock.calls.map((call) => call[0]);
      expect(actions).toEqual(["referral_code", "checkout"]);
    });

    it("nói riêng về ô mã khi cổng hạn mức của chính ô đó chặn", async () => {
      mocks.allowUserAction.mockImplementation(async (action: string) =>
        action !== "referral_code",
      );
      const form = new FormData();
      form.set("maGioiThieu", "SKGAXBZR");

      const result = await checkout({}, form);

      // KHÔNG được mượn câu "đặt đơn quá nhiều lần": người mua chưa đặt đơn nào,
      // họ chỉ đang gõ lại một mã chép tay.
      expect(result.error).toContain("mã giới thiệu quá nhiều lần");
      expect(result.error).not.toContain("đặt đơn");
      expect(mocks.createOrder).not.toHaveBeenCalled();
    });

    /**
     * Báo giá của giỏ hàng đã cũ: `claimed` vừa khác null ở một tab khác, nên
     * `createOrder` lặng lẽ KHÔNG gắn người giới thiệu và không giảm giá. Chốt
     * giá bắt được phần lệch và hủy đơn vừa tạo — người mua nhận câu "số tiền
     * vừa thay đổi" chứ không phải một câu về mã, và luồng tự lành sau một lần
     * tải lại (`refreshCatalog` → `canEnterCode` thành false → ô mã biến mất).
     */
    it("hủy đơn khi mã hợp lệ nhưng server từ chối gắn, và mời xem lại giỏ", async () => {
      mocks.createOrder.mockResolvedValue({
        ok: true,
        orderId: "order-1",
        code: 100001,
        // Không có khoản giảm nào: người này đã chốt quyền ưu đãi từ trước.
        amountVnd: 1_000_000,
        expiresAt: new Date(),
      });
      mocks.cancelOrder.mockResolvedValue({ cancelled: true });

      const form = new FormData();
      form.set("maGioiThieu", "SKGAXBZR");
      // Giỏ hàng đã lạc quan trừ sẵn 10% vì nó còn thấy `canEnterCode`.
      form.set("tongTienDuKien", "900000");

      const result = await checkout({}, form);

      expect(mocks.cancelOrder).toHaveBeenCalledWith("order-1", {
        userId: "user-1",
      });
      expect(result.error).toContain("Số tiền vừa thay đổi");
      expect(result.refreshCatalog).toBe(true);
      expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
    });

    it("bỏ qua ô mã để trống — createOrder nhận referrerId undefined", async () => {
      const form = new FormData();
      form.set("maGioiThieu", "   ");

      await expect(checkout({}, form)).rejects.toMatchObject({
        url: "https://payos.test/checkout",
      });
      // Không có lượt tra nào theo referralCode.
      for (const call of mocks.findUnique.mock.calls) {
        expect("referralCode" in call[0].where).toBe(false);
      }
      expect(mocks.createOrder).toHaveBeenCalledWith(
        "user-1",
        ["course-b", "course-a"],
        { members: [], useCredit: false, referrerId: undefined },
      );
    });
  });

  it("từ chối trước khi giữ chỗ khi có email chưa có tài khoản", async () => {
    mocks.resolveGroupMembers.mockResolvedValue({
      members: [],
      unregistered: ["chua-co@hdi.test"],
    });

    const form = new FormData();
    form.append("thanhVien", "chua-co@hdi.test");

    const result = await checkout({}, form);
    expect(result.error).toContain("chua-co@hdi.test");
    // Không được tạo ghi danh giữ chỗ cho một nhóm chắc chắn sẽ bị từ chối.
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  /**
   * Bảng giá hoặc số người có thể đổi giữa lúc giỏ hàng báo giá và lúc ghi đơn.
   * Đơn đã tạo phải bị hủy chứ không để lại: nó đang giữ ghế và sắp có một link
   * PayOS mang con số học viên chưa từng đồng ý.
   */
  it("hủy đơn vừa tạo khi số tiền lệch với con số học viên đã thấy", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      groupSize: 1,
      expiresAt: new Date(),
    });

    const form = new FormData();
    form.set("tongTienDuKien", "750000");

    mocks.cancelOrder.mockResolvedValue({ cancelled: true, released: 1 });

    const result = await checkout({}, form);
    expect(result.refreshCatalog).toBe(true);
    expect(result.error).toContain("thay đổi");
    expect(mocks.cancelOrder).toHaveBeenCalledWith("order-1", { userId: "user-1" });
    expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
    expect(mocks.writeCartIds).not.toHaveBeenCalled();
  });

  /**
   * Rollback chốt giá có thể KHÔNG thành: PayOS chập, hoặc link đã nhận tiền.
   * Khi đó đơn vừa tạo vẫn đang giữ ghế, giữ credits và giữ suất giảm giá "đơn
   * đầu tiên" của chính người này — nên bảo họ "kiểm tra lại giỏ hàng" là chỉ
   * sai đường: quay lại giỏ sẽ ra một con số khác nữa, vì số dư credits đang bị
   * chính đơn treo kia trừ mất.
   */
  it("đưa học viên tới trang đơn khi không hủy được đơn vừa tạo", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      groupSize: 1,
      expiresAt: new Date(),
    });
    mocks.cancelOrder.mockResolvedValue({
      cancelled: false,
      released: 0,
      reason: "gateway_unavailable",
    });

    const form = new FormData();
    form.set("tongTienDuKien", "750000");

    await expect(checkout({}, form)).rejects.toMatchObject({
      url: "/tai-khoan/don-hang/100001",
    });
    // Giỏ giữ nguyên: đơn treo có thể được hủy từ trang kia, và khi đó người mua
    // cần giỏ của mình còn nguyên để thử lại.
    expect(mocks.writeCartIds).not.toHaveBeenCalled();
    expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
  });
});
