CREATE TABLE "course_video_watermark_setting" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "showEmail" BOOLEAN NOT NULL DEFAULT true,
    "showCourseTitle" BOOLEAN NOT NULL DEFAULT true,
    "showTimestamp" BOOLEAN NOT NULL DEFAULT true,
    "emailDisplayMode" TEXT NOT NULL DEFAULT 'FULL',
    "opacityPercent" INTEGER NOT NULL DEFAULT 18,
    "textSize" TEXT NOT NULL DEFAULT 'MD',
    "movementMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "moveIntervalSec" INTEGER NOT NULL DEFAULT 12,
    "tamperPauseEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_video_watermark_setting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_video_watermark_setting_courseId_key"
    ON "course_video_watermark_setting"("courseId");
CREATE INDEX "course_video_watermark_setting_enabled_idx"
    ON "course_video_watermark_setting"("enabled");

ALTER TABLE "course_video_watermark_setting"
    ADD CONSTRAINT "course_video_watermark_setting_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
