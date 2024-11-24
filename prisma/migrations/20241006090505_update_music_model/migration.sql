/*
  Warnings:

  - You are about to drop the column `create_by` on the `artist` table. All the data in the column will be lost.
  - You are about to drop the column `album_id` on the `music` table. All the data in the column will be lost.
  - You are about to alter the column `genre` on the `music` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - Added the required column `created_by` to the `Artist` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `artist` DROP FOREIGN KEY `Artist_user_id_fkey`;

-- AlterTable
ALTER TABLE `artist` DROP COLUMN `create_by`,
    ADD COLUMN `created_by` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `music` DROP COLUMN `album_id`,
    MODIFY `genre` ENUM('ROCK', 'POP', 'JAZZ', 'HIP_HOP', 'CLASSICAL', 'ELECTRONIC', 'COUNTRY') NOT NULL DEFAULT 'CLASSICAL';

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
