ALTER TABLE "order"
  ADD COLUMN "refundOperationToken" TEXT,
  ADD COLUMN "refundOperationStartedAt" TIMESTAMP(3),
  ADD COLUMN "refundGatewayRefundId" TEXT,
  ADD COLUMN "refundError" TEXT,
  ADD COLUMN "refundStatus" TEXT;

ALTER TABLE "course_subscription"
  ADD COLUMN "cancellationOperationToken" TEXT,
  ADD COLUMN "cancellationOperationStartedAt" TIMESTAMP(3),
  ADD COLUMN "cancellationError" TEXT;

CREATE INDEX "order_refund_operation_lease_idx"
  ON "order"("refundOperationStartedAt");

CREATE INDEX "course_subscription_cancellation_operation_lease_idx"
  ON "course_subscription"("cancellationOperationStartedAt");
