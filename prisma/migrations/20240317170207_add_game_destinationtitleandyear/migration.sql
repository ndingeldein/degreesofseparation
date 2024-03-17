-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "destinationMovieTitle" TEXT NOT NULL DEFAULT 'The Great Escape',
ADD COLUMN     "destinationMovieYear" INTEGER NOT NULL DEFAULT 1963;
