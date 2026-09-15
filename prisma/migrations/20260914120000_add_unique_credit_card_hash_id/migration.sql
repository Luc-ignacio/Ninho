-- CreateIndex
CREATE UNIQUE INDEX "Transaction_creditCardId_hashId_key" ON "Transaction"("creditCardId", "hashId");

