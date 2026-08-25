CREATE TYPE "EmailDeliveryType" AS ENUM ('WELCOME_EMAIL', 'EXPIRATION_REMINDER');

CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "email_delivery_log" (
    "id" TEXT NOT NULL,
    "type" "EmailDeliveryType" NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT,
    "subscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_delivery_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_welcome_email" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "subjectTemplate" TEXT NOT NULL,
    "markdownTemplate" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_welcome_email_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_expiration_reminder" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_expiration_reminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_welcome_email_courseId_key" ON "course_welcome_email"("courseId");
CREATE INDEX "email_delivery_log_type_idx" ON "email_delivery_log"("type");
CREATE INDEX "email_delivery_log_status_idx" ON "email_delivery_log"("status");
CREATE INDEX "email_delivery_log_userId_idx" ON "email_delivery_log"("userId");
CREATE INDEX "email_delivery_log_createdAt_idx" ON "email_delivery_log"("createdAt");
CREATE UNIQUE INDEX "course_expiration_reminder_subscriptionId_daysBefore_key" ON "course_expiration_reminder"("subscriptionId", "daysBefore");
CREATE INDEX "course_expiration_reminder_sentAt_idx" ON "course_expiration_reminder"("sentAt");

ALTER TABLE "email_delivery_log" ADD CONSTRAINT "email_delivery_log_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_delivery_log" ADD CONSTRAINT "email_delivery_log_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "course_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_delivery_log" ADD CONSTRAINT "email_delivery_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_delivery_log" ADD CONSTRAINT "email_delivery_log_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_welcome_email" ADD CONSTRAINT "course_welcome_email_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_expiration_reminder" ADD CONSTRAINT "course_expiration_reminder_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "course_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
