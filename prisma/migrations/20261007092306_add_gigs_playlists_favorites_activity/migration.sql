-- AlterTable
ALTER TABLE `artist` ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `instagram` VARCHAR(191) NULL,
    ADD COLUMN `photo` MEDIUMTEXT NULL,
    ADD COLUMN `spotify` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL,
    ADD COLUMN `youtube` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `music` ADD COLUMN `coverUrl` MEDIUMTEXT NULL,
    ADD COLUMN `durationSec` INTEGER NULL,
    ADD COLUMN `releaseDate` DATE NULL,
    MODIFY `genre` ENUM('RNB', 'COUNTRY', 'CLASSIC', 'ROCK', 'JAZZ', 'POP', 'HIPHOP', 'ELECTRONIC', 'FOLK', 'BLUES') NOT NULL DEFAULT 'CLASSIC';

-- CreateTable
CREATE TABLE `playlists` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `playlists_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `playlist_items` (
    `id` VARCHAR(191) NOT NULL,
    `playlist_id` VARCHAR(191) NOT NULL,
    `music_id` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,

    INDEX `playlist_items_playlist_id_position_idx`(`playlist_id`, `position`),
    UNIQUE INDEX `playlist_items_playlist_id_music_id_key`(`playlist_id`, `music_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `target_type` ENUM('ARTIST', 'SONG') NOT NULL,
    `target_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorites_target_type_target_id_idx`(`target_type`, `target_id`),
    UNIQUE INDEX `favorites_user_id_target_type_target_id_key`(`user_id`, `target_type`, `target_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gigs` (
    `id` VARCHAR(191) NOT NULL,
    `artist_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `venue` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('HOLD', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `fee` INTEGER NULL,
    `notes` TEXT NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `gigs_artist_id_idx`(`artist_id`),
    INDEX `gigs_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `user_name` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NULL,
    `summary` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `activity_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `playlists` ADD CONSTRAINT `playlists_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `playlist_items` ADD CONSTRAINT `playlist_items_playlist_id_fkey` FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `playlist_items` ADD CONSTRAINT `playlist_items_music_id_fkey` FOREIGN KEY (`music_id`) REFERENCES `Music`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gigs` ADD CONSTRAINT `gigs_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
