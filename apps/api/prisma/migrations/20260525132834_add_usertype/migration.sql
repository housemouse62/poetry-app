-- CreateEnum
CREATE TYPE "Usertype" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "usertype" "Usertype" NOT NULL DEFAULT 'user';
