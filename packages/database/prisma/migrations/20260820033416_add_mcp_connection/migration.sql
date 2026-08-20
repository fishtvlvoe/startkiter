-- CreateTable
CREATE TABLE "mcp_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "authorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "mcp_connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mcp_connection_userId_idx" ON "mcp_connection"("userId");

-- AddForeignKey
ALTER TABLE "mcp_connection" ADD CONSTRAINT "mcp_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
