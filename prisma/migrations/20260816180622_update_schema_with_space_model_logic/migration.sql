/*
  Warnings:

  - The values [PIX] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `householdId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `householdId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `householdId` on the `CreditCard` table. All the data in the column will be lost.
  - You are about to drop the column `householdId` on the `Import` table. All the data in the column will be lost.
  - You are about to drop the column `householdId` on the `InstallmentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `householdId` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `householdId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Household` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[spaceId,hashId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `spaceId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `CreditCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `Import` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `InstallmentPurchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SpaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TransactionMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BOLETO', 'CASH', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'CREDIT_CARD_PAYMENT');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_householdId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_householdId_fkey";

-- DropForeignKey
ALTER TABLE "CreditCard" DROP CONSTRAINT "CreditCard_householdId_fkey";

-- DropForeignKey
ALTER TABLE "Import" DROP CONSTRAINT "Import_householdId_fkey";

-- DropForeignKey
ALTER TABLE "InstallmentPurchase" DROP CONSTRAINT "InstallmentPurchase_householdId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_householdId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_householdId_fkey";

-- DropIndex
DROP INDEX "Account_householdId_idx";

-- DropIndex
DROP INDEX "Category_householdId_idx";

-- DropIndex
DROP INDEX "CreditCard_householdId_idx";

-- DropIndex
DROP INDEX "Import_householdId_idx";

-- DropIndex
DROP INDEX "InstallmentPurchase_householdId_idx";

-- DropIndex
DROP INDEX "Profile_householdId_idx";

-- DropIndex
DROP INDEX "Transaction_householdId_hashId_key";

-- DropIndex
DROP INDEX "Transaction_householdId_idx";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "householdId",
ADD COLUMN     "spaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "householdId",
ADD COLUMN     "spaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "CreditCard" DROP COLUMN "householdId",
ADD COLUMN     "spaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Import" DROP COLUMN "householdId",
ADD COLUMN     "spaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "InstallmentPurchase" DROP COLUMN "householdId",
ADD COLUMN     "spaceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "householdId";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "householdId",
ADD COLUMN     "method" "TransactionMethod" NOT NULL,
ADD COLUMN     "spaceId" UUID NOT NULL;

-- DropTable
DROP TABLE "Household";

-- DropEnum
DROP TYPE "CategorizationMatchType";

-- CreateTable
CREATE TABLE "Space" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceMember" (
    "id" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "role" "SpaceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpaceMember_profileId_idx" ON "SpaceMember"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceMember_spaceId_profileId_key" ON "SpaceMember"("spaceId", "profileId");

-- CreateIndex
CREATE INDEX "Account_spaceId_idx" ON "Account"("spaceId");

-- CreateIndex
CREATE INDEX "Category_spaceId_idx" ON "Category"("spaceId");

-- CreateIndex
CREATE INDEX "CreditCard_spaceId_idx" ON "CreditCard"("spaceId");

-- CreateIndex
CREATE INDEX "Import_spaceId_idx" ON "Import"("spaceId");

-- CreateIndex
CREATE INDEX "InstallmentPurchase_spaceId_idx" ON "InstallmentPurchase"("spaceId");

-- CreateIndex
CREATE INDEX "Transaction_spaceId_idx" ON "Transaction"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_spaceId_hashId_key" ON "Transaction"("spaceId", "hashId");

-- AddForeignKey
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPurchase" ADD CONSTRAINT "InstallmentPurchase_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
