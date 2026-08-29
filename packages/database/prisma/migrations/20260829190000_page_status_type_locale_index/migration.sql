DROP INDEX IF EXISTS "page_type_status_locale_idx";

CREATE INDEX "page_status_type_locale_idx" ON "page"("status", "type", "locale");
