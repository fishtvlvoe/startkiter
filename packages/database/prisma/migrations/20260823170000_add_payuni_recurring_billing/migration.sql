-- PAYUNi recurring billing: course-scoped plans, subscriptions, and webhook inbox.

CREATE TYPE "SubscriptionInterval" AS ENUM ('MONTH', 'YEAR');
CREATE TYPE "CourseSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELED');
CREATE TYPE "PaymentWebhookEventStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "course_subscription_plan" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "interval" "SubscriptionInterval" NOT NULL,
    "price" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_subscription_plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "CourseSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayTradeNo" TEXT NOT NULL,
    "gatewaySubscriptionId" TEXT,
    "interval" "SubscriptionInterval" NOT NULL,
    "pricePerPeriod" INTEGER NOT NULL,
    "paidPeriods" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodEnd" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "invoiceType" TEXT,
    "invoiceCarrierType" TEXT,
    "invoiceCarrierId" TEXT,
    "invoiceTaxId" TEXT,
    "invoiceTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_webhook_event" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "PaymentWebhookEventStatus" NOT NULL DEFAULT 'PROCESSING',
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_webhook_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_subscription_plan_sku_key" ON "course_subscription_plan"("sku");
CREATE INDEX "course_subscription_plan_courseId_idx" ON "course_subscription_plan"("courseId");
CREATE UNIQUE INDEX "course_subscription_gatewayTradeNo_key" ON "course_subscription"("gatewayTradeNo");
CREATE INDEX "course_subscription_userId_idx" ON "course_subscription"("userId");
CREATE INDEX "course_subscription_courseId_idx" ON "course_subscription"("courseId");
CREATE INDEX "course_subscription_userId_courseId_idx" ON "course_subscription"("userId", "courseId");
CREATE UNIQUE INDEX "course_subscription_active_unique" ON "course_subscription"("userId", "courseId")
WHERE "status" IN ('PENDING', 'ACTIVE');
CREATE UNIQUE INDEX "payment_webhook_event_gateway_eventId_key" ON "payment_webhook_event"("gateway", "eventId");

ALTER TABLE "course_subscription_plan"
  ADD CONSTRAINT "course_subscription_plan_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_subscription"
  ADD CONSTRAINT "course_subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "course_subscription_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "course_subscription_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "course_subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
