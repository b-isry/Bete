-- AlterTable
ALTER TABLE "User" ADD COLUMN     "primary_city_id" INTEGER;

-- CreateIndex
CREATE INDEX "User_primary_city_id_idx" ON "User"("primary_city_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primary_city_id_fkey" FOREIGN KEY ("primary_city_id") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
