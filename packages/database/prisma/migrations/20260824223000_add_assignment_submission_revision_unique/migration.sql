-- Prevent concurrent submissions from allocating the same revision number.
CREATE UNIQUE INDEX "assignment_submission_pluginContentId_userId_revisionNumber_key"
ON "assignment_submission"("pluginContentId", "userId", "revisionNumber");
