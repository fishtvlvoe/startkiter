-- AlterEnum
ALTER TYPE "LessonMessageUploadIntentStatus" ADD VALUE 'CLEANING';

-- DropIndex
DROP INDEX "lesson_message_upload_intent_status_expiresAt_idx";

-- AlterTable
ALTER TABLE "lesson_message_upload_intent" ADD COLUMN     "cleanupClaimedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "lesson_message_upload_intent_status_expiresAt_cleanupClaime_idx" ON "lesson_message_upload_intent"("status", "expiresAt", "cleanupClaimedAt");
