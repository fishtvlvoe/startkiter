-- CreateEnum
CREATE TYPE "EmailBounceState" AS ENUM ('NONE', 'SOFT_SUSPENDED', 'HARD_BOUNCED', 'COMPLAINED');

-- CreateEnum
CREATE TYPE "NewsletterType" AS ENUM ('GENERAL', 'PROMO');

-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'QUEUED', 'SENDING', 'PAUSED', 'SENT', 'PARTIAL_FAILED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NewsletterRecipientStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "NewsletterAutomationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EmailConsentType" AS ENUM ('GENERAL', 'MARKETING');

-- CreateEnum
CREATE TYPE "EmailConsentAction" AS ENUM ('GRANTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "NewsletterAlertType" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "newsletterCampaignId" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "emailBounceCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailBounceState" "EmailBounceState" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "emailInvalidAt" TIMESTAMP(3),
ADD COLUMN     "generalEmailConsent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "generalEmailConsentAt" TIMESTAMP(3),
ADD COLUMN     "marketingConsent" BOOLEAN,
ADD COLUMN     "marketingConsentAt" TIMESTAMP(3),
ADD COLUMN     "marketingConsentIp" TEXT,
ADD COLUMN     "marketingConsentSource" TEXT,
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "type" "NewsletterType" NOT NULL DEFAULT 'GENERAL',
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "contentJson" JSONB NOT NULL,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "templateId" TEXT,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
    "senderName" TEXT,
    "replyTo" TEXT,
    "segmentJson" JSONB,
    "couponId" TEXT,
    "attributionWindowDays" INTEGER NOT NULL DEFAULT 7,
    "ratePerMinute" INTEGER NOT NULL DEFAULT 60,
    "senderSnapshot" JSONB,
    "sentCursor" INTEGER NOT NULL DEFAULT 0,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "unsubCount" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeatAt" TIMESTAMP(3),
    "snapshotAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "status" "NewsletterRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "skipReason" TEXT,
    "bounceType" TEXT,
    "providerMessageId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "openedAt" TIMESTAMP(3),
    "firstClickedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterTemplate" (
    "id" TEXT NOT NULL,
    "type" "NewsletterType" NOT NULL,
    "name" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterLink" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recipientId" TEXT,
    "token" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueClickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "consentType" "EmailConsentType" NOT NULL,
    "action" "EmailConsentAction" NOT NULL,
    "source" TEXT NOT NULL,
    "ip" TEXT,
    "market" TEXT,
    "termsVersion" TEXT,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterAlert" (
    "id" TEXT NOT NULL,
    "type" "NewsletterAlertType" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "campaignId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterAutomation" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterAutomationStep" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "delayHours" INTEGER NOT NULL DEFAULT 0,
    "subjectTemplate" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterAutomationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterAutomationEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterAutomationEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterAutomationDelivery" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "stepId" TEXT,
    "status" "NewsletterAutomationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterAutomationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterAutomationOpen" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterAutomationOpen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterAutomationClick" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterAutomationClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsletterCampaign_status_scheduledAt_idx" ON "NewsletterCampaign"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_createdById_createdAt_idx" ON "NewsletterCampaign"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_type_status_idx" ON "NewsletterCampaign"("type", "status");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_updatedAt_idx" ON "NewsletterCampaign"("updatedAt");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_toEmail_createdAt_idx" ON "NewsletterRecipient"("toEmail", "createdAt");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_status_createdAt_idx" ON "NewsletterRecipient"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_providerMessageId_idx" ON "NewsletterRecipient"("providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterRecipient_campaignId_userId_key" ON "NewsletterRecipient"("campaignId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterRecipient_campaignId_toEmail_key" ON "NewsletterRecipient"("campaignId", "toEmail");

-- CreateIndex
CREATE INDEX "NewsletterTemplate_type_isBuiltIn_idx" ON "NewsletterTemplate"("type", "isBuiltIn");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterLink_token_key" ON "NewsletterLink"("token");

-- CreateIndex
CREATE INDEX "NewsletterLink_campaignId_idx" ON "NewsletterLink"("campaignId");

-- CreateIndex
CREATE INDEX "NewsletterLink_recipientId_idx" ON "NewsletterLink"("recipientId");

-- CreateIndex
CREATE INDEX "EmailConsentLog_userId_createdAt_idx" ON "EmailConsentLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailConsentLog_email_createdAt_idx" ON "EmailConsentLog"("email", "createdAt");

-- CreateIndex
CREATE INDEX "EmailConsentLog_campaignId_idx" ON "EmailConsentLog"("campaignId");

-- CreateIndex
CREATE INDEX "NewsletterAlert_readAt_createdAt_idx" ON "NewsletterAlert"("readAt", "createdAt");

-- CreateIndex
CREATE INDEX "NewsletterAlert_campaignId_idx" ON "NewsletterAlert"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterAutomation_courseId_key" ON "NewsletterAutomation"("courseId");

-- CreateIndex
CREATE INDEX "NewsletterAutomation_enabled_idx" ON "NewsletterAutomation"("enabled");

-- CreateIndex
CREATE INDEX "NewsletterAutomationStep_automationId_enabled_stepOrder_idx" ON "NewsletterAutomationStep"("automationId", "enabled", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterAutomationStep_automationId_stepOrder_key" ON "NewsletterAutomationStep"("automationId", "stepOrder");

-- CreateIndex
CREATE INDEX "NewsletterAutomationEnrollment_automationId_enrolledAt_idx" ON "NewsletterAutomationEnrollment"("automationId", "enrolledAt");

-- CreateIndex
CREATE INDEX "NewsletterAutomationEnrollment_orderId_idx" ON "NewsletterAutomationEnrollment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterAutomationEnrollment_userId_automationId_key" ON "NewsletterAutomationEnrollment"("userId", "automationId");

-- CreateIndex
CREATE INDEX "NewsletterAutomationDelivery_status_scheduledAt_idx" ON "NewsletterAutomationDelivery"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NewsletterAutomationDelivery_stepId_idx" ON "NewsletterAutomationDelivery"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterAutomationDelivery_enrollmentId_stepId_key" ON "NewsletterAutomationDelivery"("enrollmentId", "stepId");

-- CreateIndex
CREATE INDEX "NewsletterAutomationOpen_deliveryId_openedAt_idx" ON "NewsletterAutomationOpen"("deliveryId", "openedAt");

-- CreateIndex
CREATE INDEX "NewsletterAutomationOpen_userId_openedAt_idx" ON "NewsletterAutomationOpen"("userId", "openedAt");

-- CreateIndex
CREATE INDEX "NewsletterAutomationClick_deliveryId_clickedAt_idx" ON "NewsletterAutomationClick"("deliveryId", "clickedAt");

-- CreateIndex
CREATE INDEX "NewsletterAutomationClick_userId_clickedAt_idx" ON "NewsletterAutomationClick"("userId", "clickedAt");

-- CreateIndex
CREATE INDEX "order_newsletterCampaignId_idx" ON "order"("newsletterCampaignId");

-- CreateIndex
CREATE INDEX "user_marketingConsent_idx" ON "user"("marketingConsent");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_newsletterCampaignId_fkey" FOREIGN KEY ("newsletterCampaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NewsletterTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterTemplate" ADD CONSTRAINT "NewsletterTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterLink" ADD CONSTRAINT "NewsletterLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterLink" ADD CONSTRAINT "NewsletterLink_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "NewsletterRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailConsentLog" ADD CONSTRAINT "EmailConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailConsentLog" ADD CONSTRAINT "EmailConsentLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAlert" ADD CONSTRAINT "NewsletterAlert_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomation" ADD CONSTRAINT "NewsletterAutomation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationStep" ADD CONSTRAINT "NewsletterAutomationStep_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "NewsletterAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationEnrollment" ADD CONSTRAINT "NewsletterAutomationEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationEnrollment" ADD CONSTRAINT "NewsletterAutomationEnrollment_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "NewsletterAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationEnrollment" ADD CONSTRAINT "NewsletterAutomationEnrollment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationDelivery" ADD CONSTRAINT "NewsletterAutomationDelivery_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "NewsletterAutomationEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationDelivery" ADD CONSTRAINT "NewsletterAutomationDelivery_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "NewsletterAutomationStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationOpen" ADD CONSTRAINT "NewsletterAutomationOpen_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "NewsletterAutomationDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationOpen" ADD CONSTRAINT "NewsletterAutomationOpen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationClick" ADD CONSTRAINT "NewsletterAutomationClick_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "NewsletterAutomationDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterAutomationClick" ADD CONSTRAINT "NewsletterAutomationClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
