import { handlers } from "@/lib/auth";

// Database sessions and the pg driver both need Node, not the edge runtime.
export const runtime = "nodejs";

export const { GET, POST } = handlers;
