-- AlterEnum
ALTER TYPE "LogEventType" ADD VALUE 'NOTIFICATION_SENT';
ALTER TYPE "LogEventType" ADD VALUE 'LEGAL_NOTICE_SENT';

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'DELIVERED', 'FAILED', 'INVALID_NUMBER', 'OPT_OUT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "shortName" TEXT;

-- AlterTable: publicToken added nullable first so the backfill below can
-- run before the NOT NULL + UNIQUE constraints are applied. New rows going
-- forward always supply it at insert time (see api/debtors/route.js and
-- api/debtors/upload/route.js) — there is no DB-level default here because
-- nanoid generation happens in application code, not Postgres.
ALTER TABLE "Debtor" ADD COLUMN "publicToken" TEXT;

-- Backfill existing debtors. 8 lowercase-hex characters derived from
-- md5(random() || clock_timestamp() || id) — no pgcrypto extension
-- required, and folding the row's own id into the hash input means two
-- rows touched in the same clock tick still can't collide with each other.
-- The UNIQUE index added right after this would turn any collision into a
-- loud migration failure rather than silent data corruption, and the odds
-- of one across a debtor table of this app's size are effectively zero
-- (16^8 possible values).
UPDATE "Debtor"
SET "publicToken" = substr(md5(random()::text || clock_timestamp()::text || "id"), 1, 8)
WHERE "publicToken" IS NULL;

ALTER TABLE "Debtor" ALTER COLUMN "publicToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Debtor_publicToken_key" ON "Debtor"("publicToken");

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "debtorId" TEXT,
    "userId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "detail" TEXT,
    "providerId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLog_debtorId_idx" ON "NotificationLog"("debtorId");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_channel_idx" ON "NotificationLog"("channel");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
