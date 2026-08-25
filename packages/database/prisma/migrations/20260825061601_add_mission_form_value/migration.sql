-- CreateTable
CREATE TABLE "MissionFormValue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coursePackMissionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionFormValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mission_form_value_user_idx" ON "MissionFormValue"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_form_value_user_mission_field_key" ON "MissionFormValue"("userId", "coursePackMissionId", "fieldKey");

-- AddForeignKey
ALTER TABLE "MissionFormValue" ADD CONSTRAINT "MissionFormValue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionFormValue" ADD CONSTRAINT "MissionFormValue_coursePackMissionId_fkey" FOREIGN KEY ("coursePackMissionId") REFERENCES "CoursePackMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
