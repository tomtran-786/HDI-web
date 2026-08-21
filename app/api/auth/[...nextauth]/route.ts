import { handlers } from "@/lib/auth";

// The Prisma adapter and pg driver need Node, not the edge runtime.
export const runtime = "nodejs";

export const { GET, POST } = handlers;
