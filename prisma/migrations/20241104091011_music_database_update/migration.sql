-- DropForeignKey
ALTER TABLE `music` DROP FOREIGN KEY `Music_artist_id_fkey`;

-- AlterTable
ALTER TABLE `music` MODIFY `album` VARCHAR(191) NULL,
    MODIFY `artist_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Music` ADD CONSTRAINT `Music_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
