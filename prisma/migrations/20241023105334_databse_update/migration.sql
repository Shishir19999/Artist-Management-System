/*
  Warnings:

  - You are about to drop the column `Genre` on the `music` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `music` DROP COLUMN `Genre`,
    ADD COLUMN `genre` ENUM('RNB', 'COUNTRY', 'CLASSIC', 'ROCK', 'JAZZ') NOT NULL DEFAULT 'CLASSIC';
