/*
  Warnings:

  - Changed the type of `movieId` on the `Guess` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `movieId` on the `Turn` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Guess" DROP COLUMN "movieId",
ADD COLUMN     "movieId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Turn" DROP COLUMN "movieId",
ADD COLUMN     "movieId" INTEGER NOT NULL;
