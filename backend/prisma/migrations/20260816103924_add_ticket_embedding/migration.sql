CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "embedding" vector(3072);
