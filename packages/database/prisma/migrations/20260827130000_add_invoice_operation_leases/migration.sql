ALTER TABLE "invoice"
  ADD COLUMN "operationToken" TEXT,
  ADD COLUMN "operationStartedAt" TIMESTAMP(3);

ALTER TABLE "payment_webhook_event"
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "claimToken" TEXT;

CREATE INDEX "invoice_operation_lease_idx"
  ON "invoice"("attentionReason", "operationStartedAt");

CREATE INDEX "payment_webhook_event_processing_lease_idx"
  ON "payment_webhook_event"("status", "processingStartedAt");
