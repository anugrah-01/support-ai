/*
  Warnings:

  - The `aiStatus` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AIStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "aiError" TEXT,
DROP COLUMN "aiStatus",
ADD COLUMN     "aiStatus" "AIStatus" NOT NULL DEFAULT 'PENDING';
