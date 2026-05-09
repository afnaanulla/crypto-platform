/*
  Warnings:

  - Added the required column `name` to the `CoinPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Portfolio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol` to the `Portfolio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_userId_fkey";

-- DropForeignKey
ALTER TABLE "Portfolio" DROP CONSTRAINT "Portfolio_userId_fkey";

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "triggeredPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CoinPrice" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "symbol" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Alert_isActive_isTriggered_idx" ON "Alert"("isActive", "isTriggered");

-- CreateIndex
CREATE INDEX "CoinPrice_createdAt_idx" ON "CoinPrice"("createdAt");

-- CreateIndex
CREATE INDEX "CoinPrice_coinId_createdAt_idx" ON "CoinPrice"("coinId", "createdAt");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
