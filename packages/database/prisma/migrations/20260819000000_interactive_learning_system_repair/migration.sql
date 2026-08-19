DO $$ BEGIN
  CREATE TYPE "VideoProvider" AS ENUM ('BUNNY', 'YOUTUBE', 'VIMEO', 'CUSTOM_MP4', 'HLS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "course" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chapter" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chapter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lesson" (
  "id" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "isFreePreview" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
  "videoProvider" "VideoProvider",
  "videoUrl" TEXT,
  "videoDuration" TEXT,
  "aiPrompt" TEXT,
  "aiContext" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lesson_progress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "completedBlockIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_folder" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_folder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_folder_item" (
  "id" TEXT NOT NULL,
  "folderId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_folder_item_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "course" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "completedBlockIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "lesson_progress" ALTER COLUMN "completedAt" DROP NOT NULL;
ALTER TABLE "lesson_progress" ALTER COLUMN "completedAt" DROP DEFAULT;

CREATE TABLE IF NOT EXISTS "studio_folder_collapse_state" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "folderId" TEXT NOT NULL,
  "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_folder_collapse_state_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_slug_key" ON "course"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_slug_key" ON "lesson"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_folder_collapse_state_userId_folderId_key" ON "studio_folder_collapse_state"("userId", "folderId");
CREATE INDEX IF NOT EXISTS "chapter_courseId_idx" ON "chapter"("courseId");
CREATE INDEX IF NOT EXISTS "lesson_chapterId_idx" ON "lesson"("chapterId");
CREATE INDEX IF NOT EXISTS "lesson_progress_userId_idx" ON "lesson_progress"("userId");
CREATE INDEX IF NOT EXISTS "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");
CREATE INDEX IF NOT EXISTS "studio_folder_item_folderId_idx" ON "studio_folder_item"("folderId");
CREATE INDEX IF NOT EXISTS "studio_folder_collapse_state_userId_idx" ON "studio_folder_collapse_state"("userId");
CREATE INDEX IF NOT EXISTS "studio_folder_collapse_state_folderId_idx" ON "studio_folder_collapse_state"("folderId");

DO $$ BEGIN
  ALTER TABLE "chapter" ADD CONSTRAINT "chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson" ADD CONSTRAINT "lesson_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "studio_folder_item" ADD CONSTRAINT "studio_folder_item_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "studio_folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "studio_folder_collapse_state" ADD CONSTRAINT "studio_folder_collapse_state_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "studio_folder_collapse_state" ADD CONSTRAINT "studio_folder_collapse_state_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "studio_folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "course" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "lesson" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- A module descriptor has one global registration. Folder rows only decide where
-- that single item appears; retain the earliest existing item during upgrade.
DELETE FROM "studio_folder_item" AS duplicate
USING "studio_folder_item" AS retained
WHERE duplicate."moduleId" = retained."moduleId"
  AND duplicate."id" > retained."id";

ALTER TABLE "studio_folder_item" DROP CONSTRAINT IF EXISTS "studio_folder_item_folderId_moduleId_key";
DROP INDEX IF EXISTS "studio_folder_item_folderId_moduleId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "studio_folder_item_moduleId_key" ON "studio_folder_item"("moduleId");
