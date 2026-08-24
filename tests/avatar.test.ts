import { describe, expect, it, vi } from "vitest";
import {
  avatarInitials,
  googleProfilePicture,
  safeAvatarUrl,
} from "@/lib/avatar";
import { syncGoogleAvatar } from "@/lib/auth-avatar";

const GOOGLE = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c";

describe("safeAvatarUrl", () => {
  it("nhận ảnh trên host Google phục vụ avatar", () => {
    expect(safeAvatarUrl(GOOGLE)).toBe(GOOGLE);
  });

  it("từ chối host khác, kể cả host trông giống Google", () => {
    // CSP chỉ mở lh3.googleusercontent.com. Bất cứ host nào khác vừa bị trình
    // duyệt chặn, vừa là một URL lạ được trang này tự nguyện tải về.
    expect(safeAvatarUrl("https://evil.example/a.png")).toBeNull();
    expect(safeAvatarUrl("https://lh3.googleusercontent.com.evil.test/a")).toBeNull();
  });

  it("từ chối scheme không phải https", () => {
    expect(safeAvatarUrl("http://lh3.googleusercontent.com/a")).toBeNull();
    expect(safeAvatarUrl("javascript:alert(1)")).toBeNull();
    expect(safeAvatarUrl("data:image/png;base64,AAA")).toBeNull();
  });

  it("từ chối giá trị rỗng hoặc không phải chuỗi", () => {
    expect(safeAvatarUrl("")).toBeNull();
    expect(safeAvatarUrl(null)).toBeNull();
    expect(safeAvatarUrl(undefined)).toBeNull();
    expect(safeAvatarUrl(42)).toBeNull();
    expect(safeAvatarUrl("không-phải-url")).toBeNull();
  });
});

describe("googleProfilePicture", () => {
  it("lấy `picture` trong profile OpenID", () => {
    expect(googleProfilePicture({ picture: GOOGLE })).toBe(GOOGLE);
  });

  it("trả null khi profile thiếu ảnh", () => {
    expect(googleProfilePicture({})).toBeNull();
    expect(googleProfilePicture(null)).toBeNull();
  });
});

describe("syncGoogleAvatar", () => {
  const db = (image: string | null | undefined) => ({
    user: {
      findUnique: vi.fn().mockResolvedValue(image === undefined ? null : { image }),
      update: vi.fn().mockResolvedValue({}),
    },
  });

  it("ghi ảnh mới khi database còn ảnh cũ", async () => {
    const prisma = db("https://lh3.googleusercontent.com/a/cu=s96-c");

    const result = await syncGoogleAvatar("u1", GOOGLE, prisma as never);

    expect(result.updated).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { image: GOOGLE },
    });
  });

  it("điền ảnh cho tài khoản vốn đăng ký bằng mật khẩu", async () => {
    const prisma = db(null);

    expect((await syncGoogleAvatar("u1", GOOGLE, prisma as never)).updated).toBe(true);
  });

  it("không UPDATE khi ảnh không đổi", async () => {
    const prisma = db(GOOGLE);

    expect((await syncGoogleAvatar("u1", GOOGLE, prisma as never)).updated).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("không làm gì khi không có ảnh để ghi", async () => {
    const prisma = db(null);

    expect((await syncGoogleAvatar("u1", null, prisma as never)).updated).toBe(false);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("không tạo mới khi người dùng đã biến mất", async () => {
    const prisma = db(undefined);

    expect((await syncGoogleAvatar("u1", GOOGLE, prisma as never)).updated).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("avatarInitials", () => {
  it("lấy chữ đầu của tên và họ", () => {
    expect(avatarInitials("Trịnh Công Tâm", "a@b.com")).toBe("TT");
  });

  it("một chữ khi tên chỉ có một từ", () => {
    expect(avatarInitials("Tâm", "a@b.com")).toBe("T");
  });

  it("lùi về email khi không có tên", () => {
    expect(avatarInitials(null, "hdi@example.com")).toBe("H");
    expect(avatarInitials("   ", "hdi@example.com")).toBe("H");
  });

  it("không bao giờ trả chuỗi rỗng", () => {
    expect(avatarInitials(null, null)).toBe("?");
  });
});
