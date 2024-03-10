-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Basic', 'Admin', 'SuperAdmin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'Basic';
