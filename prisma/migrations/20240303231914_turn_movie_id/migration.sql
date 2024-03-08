/*
  Warnings:

  - Added the required column `movieId` to the `Turn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "movieId" TEXT NOT NULL;
