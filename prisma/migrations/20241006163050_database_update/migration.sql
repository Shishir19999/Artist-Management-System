/*
  Warnings:

  - You are about to drop the column `createdAt` on the `artist` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `artist` table. All the data in the column will be lost.
  - You are about to drop the column `upadatedAt` on the `artist` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `artist` table. All the data in the column will be lost.
  - The values [FEMALE] on the enum `Artist_gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `album_name` on the `music` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `music` table. All the data in the column will be lost.
  - You are about to drop the column `genre` on the `music` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `music` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `fname` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `lname` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.
  - The values [FEMALE] on the enum `Artist_gender` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `name` to the `Artist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Artist` table without a default value. This is not possible if the table is not empty.
  - Made the column `dob` on table `artist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `artist` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `album` to the `Music` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Music` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Artist_user_id_fkey` ON `artist`;

-- AlterTable
ALTER TABLE `artist` DROP COLUMN `createdAt`,
    DROP COLUMN `phone`,
    DROP COLUMN `upadatedAt`,
    DROP COLUMN `user_id`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `gender` ENUM('MALE', 'FEMELE', 'OTHER') NOT NULL DEFAULT 'MALE',
    MODIFY `dob` DATETIME(3) NOT NULL,
    MODIFY `address` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `music` DROP COLUMN `album_name`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `genre`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `Genre` ENUM('RNB', 'COUNTRY', 'CLASSIC', 'ROCK', 'JAZZ') NOT NULL DEFAULT 'CLASSIC',
    ADD COLUMN `album` VARCHAR(191) NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `address`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `dob`,
    DROP COLUMN `fname`,
    DROP COLUMN `lname`,
    DROP COLUMN `phone`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `gender` ENUM('MALE', 'FEMELE', 'OTHER') NOT NULL DEFAULT 'MALE';
