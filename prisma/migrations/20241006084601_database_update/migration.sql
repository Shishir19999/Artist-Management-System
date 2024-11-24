/*
  Warnings:

  - You are about to alter the column `create_by` on the `artist` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `artist` MODIFY `create_by` INTEGER NOT NULL;
