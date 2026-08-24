-- Course-scoped management assignments for instructors.
CREATE TABLE "course_instructor" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_instructor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_instructor_courseId_userId_key"
    ON "course_instructor"("courseId", "userId");
CREATE INDEX "course_instructor_userId_idx" ON "course_instructor"("userId");
CREATE INDEX "course_instructor_courseId_idx" ON "course_instructor"("courseId");

ALTER TABLE "course_instructor"
    ADD CONSTRAINT "course_instructor_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "course_instructor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "course_instructor_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
