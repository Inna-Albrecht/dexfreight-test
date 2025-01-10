/*
  Warnings:

  - Made the column `instructions` on table `Load` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Load" ADD COLUMN     "distance" TEXT NOT NULL DEFAULT '0',
ALTER COLUMN "instructions" SET NOT NULL;
