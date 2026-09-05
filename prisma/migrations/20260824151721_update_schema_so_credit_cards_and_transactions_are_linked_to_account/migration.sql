/*
  Warnings:

  - You are about to drop the column `spaceId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `CreditCard` table. All the data in the column will be lost.
  - You are about to drop the column `spaceId` on the `CreditCard` table. All the data in the column will be lost.
  - You are about to drop the column `spaceId` on the `Import` table. All the data in the column will be lost.
  - You are about to drop the column `spaceId` on the `InstallmentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `spaceId` on the `Transaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[originAccountId,hashId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[destinationAccountId,hashId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `CreditCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `InstallmentPurchase` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "CreditCard" DROP CONSTRAINT "CreditCard_profileId_fkey";

-- DropForeignKey
ALTER TABLE "CreditCard" DROP CONSTRAINT "CreditCard_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "Import" DROP CONSTRAINT "Import_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "InstallmentPurchase" DROP CONSTRAINT "InstallmentPurchase_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_spaceId_fkey";

-- DropIndex
DROP INDEX "Category_spaceId_idx";

-- DropIndex
DROP INDEX "CreditCard_profileId_idx";

-- DropIndex
DROP INDEX "CreditCard_spaceId_idx";

-- DropIndex
DROP INDEX "Import_spaceId_idx";

-- DropIndex
DROP INDEX "InstallmentPurchase_spaceId_idx";

-- DropIndex
DROP INDEX "Transaction_spaceId_hashId_key";

-- DropIndex
DROP INDEX "Transaction_spaceId_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "spaceId",
ADD COLUMN     "accountId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "CreditCard" DROP COLUMN "profileId",
DROP COLUMN "spaceId",
ADD COLUMN     "accountId" UUID NOT NULL,
ADD COLUMN     "holderId" UUID;

-- AlterTable
ALTER TABLE "Import" DROP COLUMN "spaceId";

-- AlterTable
ALTER TABLE "InstallmentPurchase" DROP COLUMN "spaceId",
ADD COLUMN     "accountId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "spaceId";

-- CreateIndex
CREATE INDEX "Category_accountId_idx" ON "Category"("accountId");

-- CreateIndex
CREATE INDEX "CreditCard_accountId_idx" ON "CreditCard"("accountId");

-- CreateIndex
CREATE INDEX "CreditCard_holderId_idx" ON "CreditCard"("holderId");

-- CreateIndex
CREATE INDEX "InstallmentPurchase_accountId_idx" ON "InstallmentPurchase"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_originAccountId_hashId_key" ON "Transaction"("originAccountId", "hashId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_destinationAccountId_hashId_key" ON "Transaction"("destinationAccountId", "hashId");

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPurchase" ADD CONSTRAINT "InstallmentPurchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
