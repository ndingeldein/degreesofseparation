/*
  Warnings:

  - Added the required column `movieYear` to the `Guess` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movieYear` to the `Turn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guess" ADD COLUMN     "movieYear" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "movieYear" INTEGER NOT NULL;
