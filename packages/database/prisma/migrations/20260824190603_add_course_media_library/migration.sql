-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'IMAGE');

-- CreateEnum
CREATE TYPE "MediaSourceType" AS ENUM ('MANUAL', 'LESSON_CONTENT', 'COURSE_COVER');

-- AlterTable
ALTER TABLE "course" ADD COLUMN     "coverImageUrl" TEXT;

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "provider" TEXT,
    "sourceId" TEXT,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageType" "MediaSourceType" NOT NULL DEFAULT 'MANUAL',
    "usageId" TEXT,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "media_usageType_idx" ON "media"("usageType");

-- CreateIndex
CREATE INDEX "media_usageId_idx" ON "media"("usageId");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
