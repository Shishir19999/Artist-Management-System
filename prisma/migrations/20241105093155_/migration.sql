/*
  Warnings:

  - You are about to drop the column `artist_id` on the `music` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `music` DROP FOREIGN KEY `Music_artist_id_fkey`;

-- AlterTable
ALTER TABLE `music` DROP COLUMN `artist_id`,
    ADD COLUMN `artistId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Music` ADD CONSTRAINT `Music_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
