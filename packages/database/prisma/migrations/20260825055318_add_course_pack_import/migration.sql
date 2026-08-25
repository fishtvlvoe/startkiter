-- CreateTable
CREATE TABLE "CoursePack" (
    "id" TEXT NOT NULL,
    "sourcePackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "learningOutcomes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoursePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePackMission" (
    "id" TEXT NOT NULL,
    "coursePackId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "missionData" JSONB NOT NULL,

    CONSTRAINT "CoursePackMission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoursePack_sourcePackId_idx" ON "CoursePack"("sourcePackId");

-- CreateIndex
CREATE INDEX "CoursePack_status_idx" ON "CoursePack"("status");

-- CreateIndex
CREATE INDEX "CoursePackMission_coursePackId_idx" ON "CoursePackMission"("coursePackId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePackMission_coursePackId_missionId_key" ON "CoursePackMission"("coursePackId", "missionId");

-- AddForeignKey
ALTER TABLE "CoursePackMission" ADD CONSTRAINT "CoursePackMission_coursePackId_fkey" FOREIGN KEY ("coursePackId") REFERENCES "CoursePack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
