-- CreateTable
CREATE TABLE "course_invite" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_invite_redemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_invite_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_invite_tokenHash_key" ON "course_invite"("tokenHash");

-- CreateIndex
CREATE INDEX "course_invite_courseId_idx" ON "course_invite"("courseId");

-- CreateIndex
CREATE INDEX "course_invite_active_expiresAt_idx" ON "course_invite"("active", "expiresAt");

-- CreateIndex
CREATE INDEX "course_invite_redemption_courseId_idx" ON "course_invite_redemption"("courseId");

-- CreateIndex
CREATE INDEX "course_invite_redemption_inviteId_idx" ON "course_invite_redemption"("inviteId");

-- CreateIndex
CREATE UNIQUE INDEX "course_invite_redemption_userId_courseId_key" ON "course_invite_redemption"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "course_invite" ADD CONSTRAINT "course_invite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_invite_redemption" ADD CONSTRAINT "course_invite_redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_invite_redemption" ADD CONSTRAINT "course_invite_redemption_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_invite_redemption" ADD CONSTRAINT "course_invite_redemption_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "course_invite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
