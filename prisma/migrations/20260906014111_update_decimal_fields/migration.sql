/*
  Warnings:

  - You are about to alter the column `balance` on the `AccountBalanceSnapshot` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(14,2)`.
  - You are about to alter the column `totalAmount` on the `InstallmentPurchase` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(14,2)`.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(14,2)`.

*/
-- AlterTable
ALTER TABLE "AccountBalanceSnapshot" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "InstallmentPurchase" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);
