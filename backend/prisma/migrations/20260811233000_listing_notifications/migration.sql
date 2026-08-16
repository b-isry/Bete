-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LISTING_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'LISTING_REJECTED';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "rejection_reason" TEXT;
