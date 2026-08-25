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
import { courses } from "@/content/course";

const userIds: string[] = [];
const courseIds: string[] = [];
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
  await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
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
        courseRls: boolean;
        anonAuth: boolean;
        authenticatedAuth: boolean;
        anonCourse: boolean;
        authenticatedCourse: boolean;
      }[]
    >`
      SELECT a.relrowsecurity AS "authRls",
             l.relrowsecurity AS "leaseRls",
             c.relrowsecurity AS "courseRls",
             has_table_privilege('anon', 'public.auth_throttles', 'select') AS "anonAuth",
             has_table_privilege('authenticated', 'public.auth_throttles', 'select') AS "authenticatedAuth",
             has_table_privilege('anon', 'public.courses', 'select') AS "anonCourse",
             has_table_privilege('authenticated', 'public.courses', 'select') AS "authenticatedCourse"
        FROM pg_class a, pg_class l, pg_class c
       WHERE a.oid = 'public.auth_throttles'::regclass
         AND l.oid = 'public.external_sync_leases'::regclass
         AND c.oid = 'public.courses'::regclass`;
    expect(rows[0]).toEqual({
      authRls: true,
      leaseRls: true,
      courseRls: true,
      anonAuth: false,
      authenticatedAuth: false,
      anonCourse: false,
      authenticatedCourse: false,
    });
  });

  it("keeps the active-only uniqueness and foreign-key indexes", async () => {
    const indexes = await prisma.$queryRaw<{ indexname: string; indexdef: string }[]>`
      SELECT indexname, indexdef
        FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname IN (
           'enrollments_user_id_course_id_active_key',
           'enrollments_course_id_status_idx',
           'order_items_course_id_idx'
         )`;
    expect(indexes.map((row) => row.indexname).sort()).toEqual([
      "enrollments_course_id_status_idx",
      "enrollments_user_id_course_id_active_key",
      "order_items_course_id_idx",
    ]);
    expect(
      indexes.find(
        (row) => row.indexname === "enrollments_user_id_course_id_active_key",
      )?.indexdef,
    ).toContain("access_revoked_at IS NULL");
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
    const course = await prisma.course.create({
      data: {
        code: courses[0].code,
        slug: courses[0].slug,
        capacity: 1,
        priceVnd: 1_000_000,
        status: "open",
      },
    });
    courseIds.push(course.id);

    const attempts = await Promise.all([
      createOrder(first.id, [course.id]),
      createOrder(second.id, [course.id]),
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

  it("never creates a partial order when one course in the basket is invalid", async () => {
    const user = await createUser("atomic-basket");
    const [openCourse, closedCourse] = await Promise.all([
      prisma.course.create({
        data: {
          code: courses[1].code,
          slug: courses[1].slug,
          capacity: 5,
          priceVnd: 400_000,
          status: "open",
        },
      }),
      prisma.course.create({
        data: {
          code: courses[2].code,
          slug: courses[2].slug,
          capacity: 5,
          priceVnd: 600_000,
          status: "closed",
        },
      }),
    ]);
    courseIds.push(openCourse.id, closedCourse.id);

    await expect(
      createOrder(user.id, [openCourse.id, closedCourse.id]),
    ).resolves.toMatchObject({ ok: false, reason: "not_open" });
    await expect(
      prisma.order.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.enrollment.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
  });

  it("allows a new purchase only after paid access is revoked", async () => {
    const user = await createUser("repurchase");
    const course = await prisma.course.create({
      data: {
        code: courses[3].code,
        slug: courses[3].slug,
        capacity: 2,
        priceVnd: 500_000,
        status: "open",
      },
    });
    courseIds.push(course.id);
    const old = await prisma.enrollment.create({
      data: { userId: user.id, courseId: course.id, status: "paid", paidAt: new Date() },
    });

    await expect(createOrder(user.id, [course.id])).resolves.toMatchObject({
      ok: false,
      reason: "already_enrolled",
    });
    await prisma.enrollment.update({
      where: { id: old.id },
      data: { accessRevokedAt: new Date() },
    });
    await expect(createOrder(user.id, [course.id])).resolves.toMatchObject({
      ok: true,
    });
  });
});
