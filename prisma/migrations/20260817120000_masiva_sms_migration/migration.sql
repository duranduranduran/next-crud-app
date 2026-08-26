-- DropForeignKey
ALTER TABLE "InboundMessage" DROP CONSTRAINT "InboundMessage_debtorId_fkey";

-- DropForeignKey
ALTER TABLE "InboundMessage" DROP CONSTRAINT "InboundMessage_clientId_fkey";

-- AlterTable
ALTER TABLE "Debtor" ADD COLUMN     "smsOptOut" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "InboundMessage" ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "debtorId" DROP NOT NULL,
ALTER COLUMN "clientId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ProviderToken" (
    "provider" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderToken_pkey" PRIMARY KEY ("provider")
);

-- CreateTable
CREATE TABLE "SmsDeliveryLog" (
    "id" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "sendDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InboundMessage_channel_providerId_key" ON "InboundMessage"("channel", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsDeliveryLog_debtorId_campaign_sendDate_key" ON "SmsDeliveryLog"("debtorId", "campaign", "sendDate");

-- CreateIndex
CREATE INDEX "Debtor_telephone_idx" ON "Debtor"("telephone");

-- AddForeignKey
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsDeliveryLog" ADD CONSTRAINT "SmsDeliveryLog_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
