/*
  Warnings:

  - Added the required column `movieTitle` to the `Guess` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movieTitle` to the `Turn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guess" ADD COLUMN     "movieTitle" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "movieTitle" TEXT NOT NULL;
