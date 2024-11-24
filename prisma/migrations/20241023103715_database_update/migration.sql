/*
  Warnings:

  - The primary key for the `artist` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `music` DROP FOREIGN KEY `Music_artist_id_fkey`;

-- AlterTable
ALTER TABLE `artist` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `music` MODIFY `artist_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Music` ADD CONSTRAINT `Music_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `Artist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
