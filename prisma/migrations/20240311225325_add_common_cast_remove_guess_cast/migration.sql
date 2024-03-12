/*
  Warnings:

  - You are about to drop the column `castIds` on the `Guess` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Guess" DROP COLUMN "castIds";

-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "commonCast" JSONB;
