import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: LayoutProps<"/quan-tri">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/dang-nhap");
  // Not an admin: send them to their own dashboard rather than telling them an
  // admin area exists here.
  if (!isAdminEmail(session.user.email)) redirect("/tai-khoan");
  return <>{children}</>;
}
