-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "cover_image_url" TEXT,
ADD COLUMN     "logo_url" TEXT;

-- AlterTable
ALTER TABLE "SellerStats" ADD COLUMN     "avg_response_time_minutes" INTEGER;

-- AlterTable
ALTER TABLE "SellerStatsHistory" ADD COLUMN     "avg_response_time_minutes" INTEGER;

-- CreateIndex
CREATE INDEX "Property_seller_id_status_idx" ON "Property"("seller_id", "status");
