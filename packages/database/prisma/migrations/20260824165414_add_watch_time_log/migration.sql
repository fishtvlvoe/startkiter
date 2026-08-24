-- CreateTable
CREATE TABLE "watch_time_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "watchedSec" INTEGER NOT NULL DEFAULT 0,
    "lastWatchAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_time_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watch_time_log_lessonId_idx" ON "watch_time_log"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "watch_time_log_userId_lessonId_key" ON "watch_time_log"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "watch_time_log" ADD CONSTRAINT "watch_time_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_time_log" ADD CONSTRAINT "watch_time_log_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
