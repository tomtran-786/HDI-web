import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";

type LeaseRow = { owner: string };

/** Acquire an expiring lease without holding a transaction during an API call. */
export async function acquireExternalLease(resourceKey: string, ttlMs = 5 * 60_000) {
  const owner = randomUUID();
  const lockedUntil = new Date(Date.now() + ttlMs);
  const rows = await prisma.$queryRaw<LeaseRow[]>`
    INSERT INTO external_sync_leases
      (resource_key, owner, locked_until, updated_at)
    VALUES
      (${resourceKey}, ${owner}, ${lockedUntil}, now())
    ON CONFLICT (resource_key)
    DO UPDATE SET
      owner = EXCLUDED.owner,
      locked_until = EXCLUDED.locked_until,
      updated_at = now()
    WHERE external_sync_leases.locked_until <= now()
    RETURNING owner`;

  if (rows[0]?.owner !== owner) return null;
  return {
    owner,
    async renew() {
      const renewed = await prisma.externalSyncLease.updateMany({
        where: { resourceKey, owner },
        data: { lockedUntil: new Date(Date.now() + ttlMs) },
      });
      return renewed.count === 1;
    },
    async release() {
      await prisma.externalSyncLease.deleteMany({ where: { resourceKey, owner } });
    },
  };
}

export async function pruneExpiredLeases(now = new Date()) {
  const result = await prisma.externalSyncLease.deleteMany({
    where: { lockedUntil: { lt: now } },
  });
  return result.count;
}
