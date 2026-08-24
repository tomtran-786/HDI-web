import { cache } from "react";
import { prisma } from "./prisma";

/** Shared minimal projection used by every profile-completeness gate. */
export const currentProfile = cache((userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, stage: true },
  }),
);
