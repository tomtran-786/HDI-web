import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { consumeAuthLimit } from "@/lib/auth-throttle";
import {
  consumeAuthToken,
  createAuthToken,
  RESET_TOKEN_TTL_MS,
} from "@/lib/auth-tokens";
import { createOrder, processPayosPayment } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

const userIds: string[] = [];
const cohortIds: string[] = [];
const throttleActions: string[] = [];

async function createUser(label: string) {
  const id = randomUUID();
  const user = await prisma.user.create({
    data: {
      id,
      name: `Integration ${label}`,
      email: `${label}.${id}@example.test`.toLowerCase(),
      emailVerified: new Date(),
      phone: "0900000000",
      stage: "other",
    },
  });
  userIds.push(user.id);
  return user;
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.cohort.deleteMany({ where: { id: { in: cohortIds } } });
  await prisma.authThrottle.deleteMany({
    where: { action: { in: throttleActions } },
  });
  await prisma.$disconnect();
});

describe.sequential("disposable Postgres integration", () => {
  it("keeps internal coordination tables behind RLS and browser-role revokes", async () => {
    const rows = await prisma.$queryRaw<
      {
        authRls: boolean;
        leaseRls: boolean;
        anonAuth: boolean;
        authenticatedAuth: boolean;
      }[]
    >`
      SELECT a.relrowsecurity AS "authRls",
             l.relrowsecurity AS "leaseRls",
             has_table_privilege('anon', 'public.auth_throttles', 'select') AS "anonAuth",
             has_table_privilege('authenticated', 'public.auth_throttles', 'select') AS "authenticatedAuth"
        FROM pg_class a, pg_class l
       WHERE a.oid = 'public.auth_throttles'::regclass
         AND l.oid = 'public.external_sync_leases'::regclass`;
    expect(rows[0]).toEqual({
      authRls: true,
      leaseRls: true,
      anonAuth: false,
      authenticatedAuth: false,
    });
  });

  it("atomically limits a fixed window under concurrent attempts", async () => {
    const action = `it_${randomUUID().slice(0, 8)}`;
    throttleActions.push(action);
    const now = new Date("2026-08-21T03:00:00.000Z");
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        consumeAuthLimit({
          action,
          key: "student@example.test|127.0.0.1",
          limit: 10,
          windowMs: 15 * 60 * 1000,
          now,
        }),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(10);
  });

  it("allows only one concurrent consumer of a reset token", async () => {
    const user = await createUser("token");
    const created = await createAuthToken(prisma, {
      userId: user.id,
      purpose: "reset",
      ttlMs: RESET_TOKEN_TTL_MS,
    });
    const results = await Promise.all(
      [1, 2].map(() =>
        prisma.$transaction((tx) =>
          consumeAuthToken(tx, "reset", created.token),
        ),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("serializes the last seat and confirms payment atomically and idempotently", async () => {
    const [first, second] = await Promise.all([
      createUser("seat-a"),
      createUser("seat-b"),
    ]);
    const cohort = await prisma.cohort.create({
      data: {
        courseSlug: `integration-${randomUUID()}`,
        ky: "Kỳ integration",
        khaiGiang: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lichHoc: "Integration only",
        capacity: 1,
        priceVnd: 1_000_000,
        status: "open",
      },
    });
    cohortIds.push(cohort.id);

    const attempts = await Promise.all([
      createOrder(first.id, [cohort.id]),
      createOrder(second.id, [cohort.id]),
    ]);
    const winner = attempts.find((result) => result.ok);
    const loser = attempts.find((result) => !result.ok);
    expect(winner?.ok).toBe(true);
    expect(loser).toMatchObject({ ok: false, reason: "no_seats" });
    if (!winner?.ok) throw new Error("No winning order");

    const paidAt = new Date();
    const event = {
      orderCode: winner.code,
      amount: winner.amountVnd,
      currency: "VND",
      reference: `BANK-${randomUUID()}`,
      paymentLinkId: `LINK-${randomUUID()}`,
      transactionDateTime: paidAt.toISOString(),
      code: "00",
      payload: { integration: true },
    };
    await expect(processPayosPayment(event)).resolves.toMatchObject({
      outcome: "succeeded",
      fulfill: true,
    });
    await expect(processPayosPayment(event)).resolves.toMatchObject({
      outcome: "duplicate",
    });

    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: winner.orderId },
      select: {
        status: true,
        payments: { select: { status: true } },
        items: { select: { enrollment: { select: { status: true } } } },
      },
    });
    expect(stored.status).toBe("paid");
    expect(stored.payments).toEqual([{ status: "succeeded" }]);
    expect(stored.items[0]?.enrollment?.status).toBe("paid");
  });
});
