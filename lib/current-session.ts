import { cache } from "react";
import { auth } from "./auth";

/** Deduplicate Auth.js work across Server Components in one render request. */
export const currentSession = cache(() => auth());
