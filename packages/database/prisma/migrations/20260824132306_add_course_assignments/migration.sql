-- CreateTable
CREATE TABLE "assignment_submission" (
    "id" TEXT NOT NULL,
    "pluginContentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT,
    "contentFormat" TEXT,
    "wordCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_attachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_review" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "feedback" TEXT,
    "score" INTEGER,
    "letterGrade" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_draft" (
    "id" TEXT NOT NULL,
    "pluginContentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT,
    "contentFormat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignment_submission_pluginContentId_userId_idx" ON "assignment_submission"("pluginContentId", "userId");

-- CreateIndex
CREATE INDEX "assignment_submission_userId_createdAt_idx" ON "assignment_submission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "assignment_attachment_submissionId_idx" ON "assignment_attachment"("submissionId");

-- CreateIndex
CREATE INDEX "assignment_review_submissionId_idx" ON "assignment_review"("submissionId");

-- CreateIndex
CREATE INDEX "assignment_draft_userId_idx" ON "assignment_draft"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_draft_pluginContentId_userId_key" ON "assignment_draft"("pluginContentId", "userId");

-- AddForeignKey
ALTER TABLE "assignment_submission" ADD CONSTRAINT "assignment_submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attachment" ADD CONSTRAINT "assignment_attachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_review" ADD CONSTRAINT "assignment_review_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_review" ADD CONSTRAINT "assignment_review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_draft" ADD CONSTRAINT "assignment_draft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
