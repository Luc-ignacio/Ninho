/*
  Warnings:

  - You are about to drop the column `accountId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `CreditCard` table. All the data in the column will be lost.
  - Added the required column `spaceId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `CreditCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `Import` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `InstallmentPurchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_accountId_fkey";

-- DropForeignKey
ALTER TABLE "CreditCard" DROP CONSTRAINT "CreditCard_accountId_fkey";

-- DropForeignKey
ALTER TABLE "InstallmentPurchase" DROP CONSTRAINT "InstallmentPurchase_accountId_fkey";

-- DropIndex
DROP INDEX "Category_accountId_idx";

-- DropIndex
DROP INDEX "CreditCard_accountId_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "accountId",
ADD COLUMN     "spaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "CreditCard" DROP COLUMN "accountId",
ADD COLUMN     "spaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Import" ADD COLUMN     "spaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "InstallmentPurchase" ADD COLUMN     "spaceId" UUID NOT NULL,
ALTER COLUMN "accountId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "spaceId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Category_spaceId_idx" ON "Category"("spaceId");

-- CreateIndex
CREATE INDEX "CreditCard_spaceId_idx" ON "CreditCard"("spaceId");

-- CreateIndex
CREATE INDEX "Import_spaceId_idx" ON "Import"("spaceId");

-- CreateIndex
CREATE INDEX "InstallmentPurchase_spaceId_idx" ON "InstallmentPurchase"("spaceId");

-- CreateIndex
CREATE INDEX "Transaction_spaceId_date_idx" ON "Transaction"("spaceId", "date");

-- CreateIndex
CREATE INDEX "Transaction_spaceId_idx" ON "Transaction"("spaceId");

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPurchase" ADD CONSTRAINT "InstallmentPurchase_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPurchase" ADD CONSTRAINT "InstallmentPurchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
