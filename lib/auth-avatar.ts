import { prisma } from "./prisma";

/**
 * Ghi lại ảnh đại diện mới vào database.
 *
 * PrismaAdapter chỉ ghi `image` lúc TẠO tài khoản. Người dùng đổi avatar bên
 * Google, hoặc tài khoản vốn đăng ký bằng mật khẩu rồi mới liên kết Google, đều
 * để lại cột `image` cũ hoặc rỗng — nên mỗi lần đăng nhập bằng Google là một
 * dịp đồng bộ lại.
 *
 * Chỉ ghi khi giá trị thực sự khác: đăng nhập lại với cùng một avatar không nên
 * tốn một lượt UPDATE.
 */
export async function syncGoogleAvatar(
  userId: string,
  picture: string | null,
  db: typeof prisma = prisma,
) {
  if (!picture) return { updated: false as const };

  const current = await db.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  if (!current || current.image === picture) return { updated: false as const };

  await db.user.update({ where: { id: userId }, data: { image: picture } });
  return { updated: true as const };
}
