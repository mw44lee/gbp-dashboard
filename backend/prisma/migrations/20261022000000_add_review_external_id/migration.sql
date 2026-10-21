-- AlterTable
ALTER TABLE "Review" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Review_externalId_key" ON "Review"("externalId");
