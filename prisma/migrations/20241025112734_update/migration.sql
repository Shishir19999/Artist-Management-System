-- DropForeignKey
ALTER TABLE `artist` DROP FOREIGN KEY `Artist_createdBy_fkey`;

-- AlterTable
ALTER TABLE `artist` MODIFY `createdBy` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
