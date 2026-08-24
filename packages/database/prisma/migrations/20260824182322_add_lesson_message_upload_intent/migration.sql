-- CreateEnum
CREATE TYPE "LessonMessageUploadIntentStatus" AS ENUM ('PENDING', 'FINALIZED');

-- CreateTable
CREATE TABLE "lesson_message_upload_intent" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" "LessonMessageUploadIntentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_message_upload_intent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_message_upload_intent_storageKey_key" ON "lesson_message_upload_intent"("storageKey");

-- CreateIndex
CREATE INDEX "lesson_message_upload_intent_status_expiresAt_idx" ON "lesson_message_upload_intent"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "lesson_message_upload_intent" ADD CONSTRAINT "lesson_message_upload_intent_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_message_upload_intent" ADD CONSTRAINT "lesson_message_upload_intent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
