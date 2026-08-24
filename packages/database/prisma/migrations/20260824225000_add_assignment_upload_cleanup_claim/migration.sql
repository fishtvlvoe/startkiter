ALTER TABLE "assignment_upload_intent" ADD COLUMN "cleanupClaimedAt" TIMESTAMP(3);

CREATE INDEX "assignment_upload_intent_status_expiresAt_cleanupClaimedAt_idx"
ON "assignment_upload_intent"("status", "expiresAt", "cleanupClaimedAt");
