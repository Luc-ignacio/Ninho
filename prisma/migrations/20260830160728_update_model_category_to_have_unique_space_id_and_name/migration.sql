/*
  Warnings:

  - A unique constraint covering the columns `[spaceId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Category_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_spaceId_name_key" ON "Category"("spaceId", "name");
