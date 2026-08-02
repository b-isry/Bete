-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'LISTING_EXPIRING',
  'SAVED_SEARCH_MATCH',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED'
);

-- Normalize legacy placeholder types before casting to enum
UPDATE "Notification"
SET "type" = 'LISTING_EXPIRING'
WHERE "type" = 'RENEWAL_REMINDER';

DELETE FROM "Notification"
WHERE "type" NOT IN (
  'LISTING_EXPIRING',
  'SAVED_SEARCH_MATCH',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED'
);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "link_url" TEXT;

ALTER TABLE "Notification"
ALTER COLUMN "type" TYPE "NotificationType"
USING ("type"::"NotificationType");

-- DropIndex
DROP INDEX "Notification_user_id_created_at_idx";

-- CreateIndex
CREATE INDEX "Notification_user_id_read_at_idx" ON "Notification"("user_id", "read_at");
