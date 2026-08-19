-- CreateTable
CREATE TABLE "studio_folder_collapse_state" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_folder_collapse_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studio_folder_collapse_state_userId_folderId_key" ON "studio_folder_collapse_state"("userId", "folderId");

-- CreateIndex
CREATE INDEX "studio_folder_collapse_state_folderId_idx" ON "studio_folder_collapse_state"("folderId");

-- CreateIndex
CREATE INDEX "studio_folder_collapse_state_userId_idx" ON "studio_folder_collapse_state"("userId");
