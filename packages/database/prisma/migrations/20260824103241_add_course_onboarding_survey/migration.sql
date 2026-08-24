-- CreateTable
CREATE TABLE "course_onboarding_survey_response" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "purchaseFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hesitation" TEXT,
    "alternatives" TEXT,
    "discoverySource" TEXT,
    "discoverySourceOther" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_onboarding_survey_response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_onboarding_survey_response_courseId_idx" ON "course_onboarding_survey_response"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_onboarding_survey_response_userId_courseId_key" ON "course_onboarding_survey_response"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "course_onboarding_survey_response" ADD CONSTRAINT "course_onboarding_survey_response_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
