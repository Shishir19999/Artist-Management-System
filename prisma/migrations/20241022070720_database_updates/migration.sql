/*
  Warnings:

  - You are about to drop the column `created_by` on the `artist` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Artist` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `artist` DROP FOREIGN KEY `Artist_created_by_fkey`;

-- AlterTable
ALTER TABLE `artist` DROP COLUMN `created_by`,
    ADD COLUMN `createdBy` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
