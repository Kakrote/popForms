-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSection_pkey" PRIMARY KEY ("id")
);

-- Backfill one default section per existing form
INSERT INTO "FormSection" ("id", "formId", "title", "description", "sortOrder", "createdAt", "updatedAt")
SELECT concat("id", '_default'), "id", 'General', NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Form";

-- AlterTable
ALTER TABLE "Field" ADD COLUMN "sectionId" TEXT;

UPDATE "Field"
SET "sectionId" = concat("formId", '_default');

ALTER TABLE "Field" ALTER COLUMN "sectionId" SET NOT NULL;

-- DropIndex
DROP INDEX "Field_formId_fieldKey_key";

-- CreateIndex
CREATE UNIQUE INDEX "Field_sectionId_fieldKey_key" ON "Field"("sectionId", "fieldKey");

-- AddForeignKey
ALTER TABLE "FormSection" ADD CONSTRAINT "FormSection_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Field" ADD CONSTRAINT "Field_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old field -> form relation after backfill
ALTER TABLE "Field" DROP CONSTRAINT "Field_formId_fkey";
ALTER TABLE "Field" DROP COLUMN "formId";
