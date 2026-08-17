-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'refunded');

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "paymentGateway" TEXT NOT NULL DEFAULT 'payuni',
    "gatewayTradeNo" TEXT,
    "courseAccess" BOOLEAN NOT NULL DEFAULT false,
    "kitClaimEligible" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_orderNo_key" ON "order"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "order_gatewayTradeNo_key" ON "order"("gatewayTradeNo");

-- CreateIndex
CREATE INDEX "order_userId_idx" ON "order"("userId");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
