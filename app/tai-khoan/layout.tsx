import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/current-profile";
import { currentSession } from "@/lib/current-session";
import { isProfileComplete } from "@/lib/profile";

/**
 * The gate for everything under /tai-khoan.
 *
 * No middleware: database sessions need the Node runtime and Next's middleware
 * runs on the edge. Guarding in the layout means every current and future page
 * in this segment inherits both checks — a new route cannot forget them.
 */
export default async function AccountLayout({
  children,
}: LayoutProps<"/tai-khoan">) {
  const session = await currentSession();
  if (!session?.user?.id) redirect("/dang-nhap");

  // Google gives us name and email but never a phone number or what stage of
  // research someone is at — the two things the intake form always asked for.
  // Collect them once, before the dashboard.
  const user = await currentProfile(session.user.id);
  if (!user) redirect("/dang-nhap");
  if (!isProfileComplete(user)) redirect("/hoan-tat-ho-so");

  return <>{children}</>;
}
