DO $$
DECLARE
    has_snake_case BOOLEAN;
    has_camel_case BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'course_welcome_email'
          AND column_name = 'content_json'
    ) INTO has_snake_case;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'course_welcome_email'
          AND column_name = 'contentJson'
    ) INTO has_camel_case;

    IF has_snake_case AND NOT has_camel_case THEN
        ALTER TABLE "course_welcome_email" RENAME COLUMN "content_json" TO "contentJson";
    ELSIF has_snake_case AND has_camel_case THEN
        EXECUTE 'UPDATE "course_welcome_email" SET "contentJson" = "content_json" WHERE "contentJson" IS NULL AND "content_json" IS NOT NULL';
        ALTER TABLE "course_welcome_email" DROP COLUMN "content_json";
    ELSIF NOT has_snake_case AND NOT has_camel_case THEN
        ALTER TABLE "course_welcome_email" ADD COLUMN "contentJson" TEXT;
    END IF;
END $$;
