ALTER TABLE "order"
ADD COLUMN "organizationId" TEXT;

CREATE INDEX "order_organizationId_idx" ON "order"("organizationId");

ALTER TABLE "order"
ADD CONSTRAINT "order_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
