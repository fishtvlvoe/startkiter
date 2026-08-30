-- AlterTable
ALTER TABLE "order" ADD COLUMN "couponId" TEXT;
ALTER TABLE "order" ADD COLUMN "couponCode" TEXT;

-- CreateIndex
CREATE INDEX "order_couponId_idx" ON "order"("couponId");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
