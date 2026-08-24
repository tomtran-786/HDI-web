import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { currentSession } from "@/lib/current-session";

export default async function AdminLayout({
  children,
}: LayoutProps<"/quan-tri">) {
  const session = await currentSession();
  if (!session?.user?.id) redirect("/dang-nhap");
  // Not an admin: send them to their own dashboard rather than telling them an
  // admin area exists here.
  if (!isAdminEmail(session.user.email)) redirect("/tai-khoan");
  return <>{children}</>;
}
