-- AlterTable
ALTER TABLE "SavedSearch" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Saved search';

-- CreateIndex
CREATE INDEX "SavedSearch_user_id_idx" ON "SavedSearch"("user_id");
