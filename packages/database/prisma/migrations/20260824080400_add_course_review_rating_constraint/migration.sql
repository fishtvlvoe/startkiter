-- Prisma does not model CHECK constraints in schema.prisma; keep the rating
-- invariant at the database boundary as required by the course-review contract.
ALTER TABLE "course_review"
ADD CONSTRAINT "course_review_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
