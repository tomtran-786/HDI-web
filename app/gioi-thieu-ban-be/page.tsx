import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentSession } from "@/lib/current-session";

/**
 * Lối vào công khai của chương trình giới thiệu bạn bè.
 *
 * Thanh điều hướng hiện mục này cho MỌI người, nhưng trang credits thật thì nằm
 * trong `/tai-khoan` và được layout ở đó gác. Một href công khai ổn định là thứ
 * duy nhất nối được hai điều đó: khách chưa đăng nhập bấm vào không rơi vào một
 * lần redirect trống mà được đưa thẳng tới màn đăng nhập KÈM đích quay lại, nên
 * đăng nhập xong họ về đúng trang mình vừa bấm.
 *
 * Đích quay lại là hằng số viết trong file này, không phải giá trị đọc từ URL —
 * `safeNext` tồn tại cho những chỗ nhận đường dẫn từ bên ngoài, còn ở đây không
 * có gì để nhận.
 */
export const metadata: Metadata = {
  title: "Giới thiệu bạn bè — HDI Research Center",
  robots: { index: false, follow: false },
};

const REFERRAL_PATH = "/tai-khoan/gioi-thieu";

export default async function ReferralEntryPage() {
  const session = await currentSession();
  if (session?.user?.id) redirect(REFERRAL_PATH);
  redirect(`/dang-nhap?tiep=${encodeURIComponent(REFERRAL_PATH)}`);
}
