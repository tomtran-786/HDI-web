import { auth, isAdminEmail } from "./auth";

/**
 * Authorization for admin server actions.
 *
 * The layout guard on /quan-tri protects the *page*, not the actions. A server
 * action is its own POST endpoint that anyone can call with a valid session
 * cookie and the right action id — guarding only the page that renders the
 * button leaves the button's handler wide open. Every admin action calls this
 * first.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    throw new Error("Không có quyền thực hiện thao tác này.");
  }
  return session;
}
