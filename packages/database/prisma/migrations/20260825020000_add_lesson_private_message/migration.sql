CREATE TABLE "lesson_private_message" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentStorageKey" TEXT,
    "attachmentName" TEXT,
    "attachmentMimeType" TEXT,
    "attachmentSize" INTEGER,
    "isFromTeacher" BOOLEAN NOT NULL DEFAULT false,
    "readByTeacher" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_private_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lesson_private_message_lessonId_userId_createdAt_idx" ON "lesson_private_message"("lessonId", "userId", "createdAt");
CREATE INDEX "lesson_private_message_readByTeacher_createdAt_idx" ON "lesson_private_message"("readByTeacher", "createdAt");

ALTER TABLE "lesson_private_message" ADD CONSTRAINT "lesson_private_message_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_private_message" ADD CONSTRAINT "lesson_private_message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
