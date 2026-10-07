-- Roles become USER, ARTIST, ARTIST_MANAGER. Existing ADMIN rows are converted to ARTIST_MANAGER.
-- Step 1: widen the enum so both old and new values are valid
ALTER TABLE `users` MODIFY `role` ENUM('USER', 'ARTIST', 'ARTIST_MANAGER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- Step 2: convert the data
UPDATE `users` SET `role` = 'ARTIST_MANAGER' WHERE `role` = 'ADMIN';

-- Step 3: drop ADMIN and add the optional registration columns
ALTER TABLE `users`
    MODIFY `role` ENUM('USER', 'ARTIST', 'ARTIST_MANAGER') NOT NULL DEFAULT 'USER',
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `birth_date` DATE NULL;

-- Optional one-to-one link from a user with role ARTIST to their artist record
ALTER TABLE `Artist` ADD COLUMN `userId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `Artist_userId_key` ON `Artist`(`userId`);
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
