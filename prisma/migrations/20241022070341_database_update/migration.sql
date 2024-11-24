/*
  Warnings:

  - You are about to drop the column `createdBy` on the `artist` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `Artist` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `artist` DROP FOREIGN KEY `Artist_createdBy_fkey`;

-- AlterTable
ALTER TABLE `artist` DROP COLUMN `createdBy`,
    ADD COLUMN `created_by` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
