-- Persist allowance claims/results so an ambiguous provider response is never retried blindly.

CREATE TABLE "invoice_allowance_operation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "allowanceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "allowanceNumber" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_allowance_operation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoice_allowance_operation_status_check" CHECK ("status" IN ('PENDING', 'SUCCEEDED', 'FAILED', 'UNKNOWN')),
    CONSTRAINT "invoice_allowance_operation_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "invoice_allowance_operation_allowanceId_key"
    ON "invoice_allowance_operation"("allowanceId");
CREATE INDEX "invoice_allowance_operation_invoiceId_idx"
    ON "invoice_allowance_operation"("invoiceId");
CREATE INDEX "invoice_allowance_operation_status_idx"
    ON "invoice_allowance_operation"("status");
