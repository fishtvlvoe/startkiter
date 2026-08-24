-- AddForeignKey
ALTER TABLE "course_onboarding_survey_response" ADD CONSTRAINT "course_onboarding_survey_response_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
