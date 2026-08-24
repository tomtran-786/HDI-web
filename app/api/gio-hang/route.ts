import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadCart, readCartIds } from "@/lib/cart";
import { currentProfile } from "@/lib/current-profile";
import { isProfileComplete } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "auth_required" },
      { status: 401, headers: noStore },
    );
  }

  const user = await currentProfile(session.user.id);
  if (!user) {
    return NextResponse.json(
      { error: "auth_required" },
      { status: 401, headers: noStore },
    );
  }
  if (!isProfileComplete(user)) {
    return NextResponse.json(
      { error: "profile_required" },
      { status: 409, headers: noStore },
    );
  }

  const cart = await loadCart(await readCartIds(), session.user.id);
  return NextResponse.json(
    {
      // Keep this projection explicit. Adding a secret field to an internal
      // catalog object later must not silently make it part of the public API.
      catalog: cart.catalog.map((course) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
        priceVnd: course.priceVnd,
        capacity: course.capacity,
        seatsLeft: course.seatsLeft,
        availability: course.availability,
      })),
      staleIds: cart.staleIds,
    },
    { headers: noStore },
  );
}
