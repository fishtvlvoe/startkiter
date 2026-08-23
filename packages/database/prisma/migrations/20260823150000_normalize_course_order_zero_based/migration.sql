-- Course chapter and lesson positions are stored as zero-based values.
-- Re-rank existing rows so mixed historical values become contiguous and deterministic.
WITH ranked_chapters AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "courseId"
            ORDER BY "order" ASC, "createdAt" ASC, id ASC
        ) - 1 AS normalized_order
    FROM "chapter"
)
UPDATE "chapter" AS chapter
SET "order" = ranked_chapters.normalized_order
FROM ranked_chapters
WHERE chapter.id = ranked_chapters.id;

WITH ranked_lessons AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "chapterId"
            ORDER BY "order" ASC, "createdAt" ASC, id ASC
        ) - 1 AS normalized_order
    FROM "lesson"
)
UPDATE "lesson" AS lesson
SET "order" = ranked_lessons.normalized_order
FROM ranked_lessons
WHERE lesson.id = ranked_lessons.id;
