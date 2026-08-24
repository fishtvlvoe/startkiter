-- Electronic invoice records for one-time orders and subscription periods.

CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "subscriptionId" TEXT,
    "periodNumber" INTEGER,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoiceNumber" TEXT,
    "randomCode" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "amount" INTEGER NOT NULL,
    "allowanceTotal" INTEGER NOT NULL DEFAULT 0,
    "failReason" TEXT,
    "attentionReason" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoice_provider_check" CHECK ("provider" IN ('ecpay', 'ezpay')),
    CONSTRAINT "invoice_status_check" CHECK ("status" IN ('PENDING', 'ISSUED', 'FAILED', 'VOIDED', 'ALLOWANCE')),
    CONSTRAINT "invoice_source_check" CHECK (
        ("orderId" IS NOT NULL AND "subscriptionId" IS NULL AND "periodNumber" IS NULL)
        OR ("orderId" IS NULL AND "subscriptionId" IS NOT NULL AND "periodNumber" IS NOT NULL)
    )
);

ALTER TABLE "order" ADD COLUMN "invoiceType" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceCarrierType" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceCarrierId" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceTaxId" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceTitle" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceAddress" TEXT;
ALTER TABLE "order" ADD COLUMN "invoiceLoveCode" TEXT;

ALTER TABLE "course_subscription" ADD COLUMN "invoiceAddress" TEXT;
ALTER TABLE "course_subscription" ADD COLUMN "invoiceLoveCode" TEXT;

CREATE UNIQUE INDEX "invoice_orderId_key" ON "invoice"("orderId");
CREATE UNIQUE INDEX "invoice_subscription_period_key"
    ON "invoice"("subscriptionId", "periodNumber")
    WHERE "subscriptionId" IS NOT NULL;
CREATE INDEX "invoice_invoiceNumber_idx" ON "invoice"("invoiceNumber");
CREATE INDEX "invoice_status_idx" ON "invoice"("status");
CREATE INDEX "invoice_subscription_period_idx" ON "invoice"("subscriptionId", "periodNumber");

ALTER TABLE "invoice"
  ADD CONSTRAINT "invoice_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "invoice_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "course_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
