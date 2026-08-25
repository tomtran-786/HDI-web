-- Stable public course identifiers for display, support and exact SQL lookup.
-- The authored catalogue is closed over these seven slugs. Abort instead of
-- inventing a code if production contains a row the application does not know.
BEGIN;

ALTER TABLE "courses" ADD COLUMN "code" TEXT;

UPDATE "courses"
   SET "code" = CASE "slug"
     WHEN 'nckh-ung-dung-ai-xuat-ban-quoc-te' THEN 'AIQT'
     WHEN 'training-tieu-luan-nckh-kltn'      THEN 'TIEULUAN'
     WHEN 'nckh-chuyen-sau-spss'             THEN 'SPSS'
     WHEN 'stata-kinh-te-luong'               THEN 'STATA'
     WHEN 'viet-bai-tap-chi'                  THEN 'TAPCHI'
     WHEN 'viet-bao-cao-khoa-hoc'             THEN 'BAOCAO'
     WHEN 'ung-dung-chatgpt-nckh'             THEN 'CHATGPT'
     ELSE NULL
   END;

DO $$
DECLARE
  unknown_slugs TEXT;
BEGIN
  SELECT string_agg("slug", ', ' ORDER BY "slug")
    INTO unknown_slugs
    FROM "courses"
   WHERE "code" IS NULL;

  IF unknown_slugs IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot assign stable course codes; unknown slugs: %', unknown_slugs;
  END IF;
END $$;

ALTER TABLE "courses"
  ALTER COLUMN "code" SET NOT NULL,
  ADD CONSTRAINT "courses_code_format_check"
    CHECK ("code" ~ '^[A-Z0-9]{2,12}$');

CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

COMMIT;
