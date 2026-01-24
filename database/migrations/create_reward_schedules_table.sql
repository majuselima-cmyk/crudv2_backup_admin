-- Migration: Create reward_schedules table
-- Description: Menyimpan jadwal reward untuk setiap staking

-- Drop table jika sudah ada (untuk testing)
DROP TABLE IF EXISTS `reward_schedules`;

CREATE TABLE `reward_schedules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staking_id` BIGINT UNSIGNED NOT NULL,
  `member_id` BIGINT UNSIGNED NOT NULL,
  `scheduled_time` DATETIME NOT NULL COMMENT 'Waktu jadwal reward akan diberikan',
  `reward_amount` DECIMAL(20, 8) NOT NULL DEFAULT 0.00000000 COMMENT 'Jumlah reward yang akan diberikan',
  `status` ENUM('pending', 'paid', 'failed', 'skipped') NOT NULL DEFAULT 'pending' COMMENT 'Status reward: pending = belum diberikan, paid = sudah dibayar, failed = gagal, skipped = dilewati',
  `reward_history_id` BIGINT UNSIGNED NULL COMMENT 'ID reward history jika sudah diberikan',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_staking_id` (`staking_id`),
  INDEX `idx_member_id` (`member_id`),
  INDEX `idx_scheduled_time` (`scheduled_time`),
  INDEX `idx_status` (`status`),
  INDEX `idx_reward_history_id` (`reward_history_id`),
  INDEX `idx_staking_status` (`staking_id`, `status`),
  INDEX `idx_member_status` (`member_id`, `status`),
  INDEX `idx_scheduled_time_status` (`scheduled_time`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

