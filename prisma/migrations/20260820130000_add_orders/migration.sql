-- Cart → order → payment.
--
-- The cart is not in here: it is a list of cohort ids in a browser cookie. It
-- carries no prices and grants nothing, so there is nothing to persist. An
-- order is where money starts being expected, and every number in it is one the
-- server computed.


-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'paid', 'cancelled', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "amount_vnd" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "provider" VARCHAR(20),
    "provider_ref" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "price_vnd" INTEGER NOT NULL,
    "enrollment_id" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "provider_ref" VARCHAR(120) NOT NULL,
    "amount_vnd" INTEGER NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE INDEX "orders_user_id_status_idx" ON "orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "orders_status_expires_at_idx" ON "orders"("status", "expires_at");

-- CreateIndex
CREATE INDEX "order_items_enrollment_id_idx" ON "order_items"("enrollment_id");

-- CreateIndex
CREATE INDEX "order_items_cohort_id_idx" ON "order_items"("cohort_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_cohort_id_key" ON "order_items"("order_id", "cohort_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_ref_key" ON "payments"("provider", "provider_ref");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The order code a student writes in a bank transfer memo, and the number a
-- payment provider will know the order by. SERIAL above created and owns the
-- sequence; all this does is move its floor, so that no order code is ever four
-- digits — short numbers get mistyped out of transfer memos.
--
-- It lives here, in the migration, rather than in a script someone has to
-- remember: the donor codebase kept its invoice-number generator only in the
-- live database, so rebuilding from source produced a database that silently
-- could not issue an invoice.
ALTER SEQUENCE "orders_code_seq" RESTART WITH 100001;

-- The same PostgREST lockdown as 20260820120100, for the three new tables. The
-- ALTER DEFAULT PRIVILEGES in that migration keeps `anon` from being granted
-- anything here, but row level security is per-table and has to be switched on
-- explicitly — a new table in `public` is otherwise readable through the
-- project's anon key, and that key is designed to be published.
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "orders", "order_items", "payments" FROM anon, authenticated;
REVOKE ALL ON SEQUENCE "orders_code_seq" FROM anon, authenticated;
