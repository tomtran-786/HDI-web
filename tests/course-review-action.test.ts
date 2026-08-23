import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  allowUserAction: vi.fn(),
  canReview: vi.fn(),
  upsert: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("@/lib/fulfillment", () => ({ reconcileDriveFolder: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    courseReview: { upsert: mocks.upsert },
    enrollment: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/reviews", async () => {
  // Phần thuần (isValidRating, normalizeComment) dùng bản thật; chỉ `canReview`
  // bị thay vì nó là thứ chạm database.
  const real = await vi.importActual<typeof import("@/lib/review-input")>(
    "@/lib/review-input",
  );
  return { ...real, canReview: mocks.canReview };
});

import { saveReview } from "@/app/tai-khoan/actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const COURSE = "clh0000000000000000000000";

describe("gửi đánh giá khóa học", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.allowUserAction.mockResolvedValue(true);
    mocks.canReview.mockResolvedValue(true);
  });

  it("ghi đánh giá của học viên đã thanh toán, luôn ở trạng thái chờ duyệt", async () => {
    const result = await saveReview(
      {},
      form({ courseId: COURSE, rating: "5", comment: "  Rất rõ ràng.  " }),
    );

    expect(result).toEqual({ saved: true });
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { courseId_userId: { courseId: COURSE, userId: "user-1" } },
      create: { courseId: COURSE, userId: "user-1", rating: 5, comment: "Rất rõ ràng." },
      update: {
        rating: 5,
        comment: "Rất rõ ràng.",
        status: "pending",
        moderatedAt: null,
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tai-khoan");
  });

  it("từ chối người chưa đăng nhập trước khi chạm tới bất cứ thứ gì", async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await saveReview({}, form({ courseId: COURSE, rating: "5" }));
    expect(result.error).toBeTruthy();
    expect(mocks.canReview).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("từ chối người đăng nhập nhưng chưa mua khóa này", async () => {
    mocks.canReview.mockResolvedValue(false);
    const result = await saveReview({}, form({ courseId: COURSE, rating: "5" }));
    expect(result.error).toContain("đã thanh toán");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("từ chối mọi số sao ngoài miền 1–5", async () => {
    for (const bad of ["0", "6", "-1", "4.5", "", "năm", "[object Object]"]) {
      const result = await saveReview({}, form({ courseId: COURSE, rating: bad }));
      expect(result.error, `rating=${bad}`).toBeTruthy();
    }
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("từ chối courseId không phải một id — không để object lọt vào Prisma", async () => {
    const forged = new FormData();
    forged.set("rating", "5");
    // Một Server Action là endpoint POST riêng: client gửi được thứ không phải
    // chuỗi id, và `where: { id: { not: "" } }` khớp hàng đầu tiên bất kỳ.
    forged.append("courseId", "../../etc/passwd");
    const result = await saveReview({}, forged);
    expect(result.error).toBeTruthy();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("chặn khi vượt hạn mức, và không đọc tới database", async () => {
    mocks.allowUserAction.mockResolvedValue(false);
    const result = await saveReview({}, form({ courseId: COURSE, rating: "4" }));
    expect(result.error).toContain("quá nhiều lần");
    expect(mocks.canReview).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("lưu bình luận rỗng thành null chứ không phải chuỗi rỗng", async () => {
    await saveReview({}, form({ courseId: COURSE, rating: "3", comment: "   " }));
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ comment: null }),
      }),
    );
  });
});
