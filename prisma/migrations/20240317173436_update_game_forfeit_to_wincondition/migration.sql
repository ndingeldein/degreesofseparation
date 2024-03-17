/*
  Warnings:

  - You are about to drop the column `forfeit` on the `Game` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GameWinCondition" AS ENUM ('Draw', 'WrongGuess', 'DestinationMovie', 'Forfeit');

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "forfeit",
ADD COLUMN     "winCondition" "GameWinCondition";
