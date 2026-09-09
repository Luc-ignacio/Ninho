-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_installmentPurchaseId_fkey";

-- AlterTable
ALTER TABLE "CreditCard" DROP COLUMN "closingDay",
ADD COLUMN     "creditLimit" DECIMAL(14,2);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_installmentPurchaseId_fkey" FOREIGN KEY ("installmentPurchaseId") REFERENCES "InstallmentPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

