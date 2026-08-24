-- CreateIndex
CREATE INDEX "assignment_submission_pluginContentId_status_submittedAt_idx" ON "assignment_submission"("pluginContentId", "status", "submittedAt");

-- CreateTable
CREATE TABLE "assignment_upload_intent" (
    "id" TEXT NOT NULL,
    "pluginContentId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_upload_intent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assignment_upload_intent_storageKey_key" ON "assignment_upload_intent"("storageKey");

-- CreateIndex
CREATE INDEX "assignment_upload_intent_submissionId_status_idx" ON "assignment_upload_intent"("submissionId", "status");

-- CreateIndex
CREATE INDEX "assignment_upload_intent_userId_pluginContentId_status_idx" ON "assignment_upload_intent"("userId", "pluginContentId", "status");

-- AddForeignKey
ALTER TABLE "assignment_upload_intent" ADD CONSTRAINT "assignment_upload_intent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_upload_intent" ADD CONSTRAINT "assignment_upload_intent_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
