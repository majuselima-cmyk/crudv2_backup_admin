-- Function/Procedure untuk generate reward schedules saat staking dibuat
-- Description: Membuat jadwal reward berdasarkan staking, interval, dan durasi

DELIMITER $$

-- Procedure untuk membuat reward schedules untuk staking baru
DROP PROCEDURE IF EXISTS `generate_reward_schedules`$$

CREATE PROCEDURE `generate_reward_schedules`(
  IN p_staking_id BIGINT UNSIGNED,
  IN p_member_id BIGINT UNSIGNED,
  IN p_staked_at DATETIME,
  IN p_duration_minutes INT,
  IN p_reward_percentage DECIMAL(5, 2),
  IN p_coin_amount DECIMAL(20, 8),
  IN p_reward_interval_minutes INT
)
BEGIN
  DECLARE v_reward_amount DECIMAL(20, 8);
  DECLARE v_end_time DATETIME;
  DECLARE v_current_time DATETIME;
  DECLARE v_count INT DEFAULT 0;
  
  -- Hitung reward amount per interval
  SET v_reward_amount = (p_coin_amount * p_reward_percentage) / 100;
  
  -- Set waktu akhir
  SET v_end_time = DATE_ADD(p_staked_at, INTERVAL p_duration_minutes MINUTE);
  
  -- Waktu reward pertama adalah setelah interval pertama
  SET v_current_time = DATE_ADD(p_staked_at, INTERVAL p_reward_interval_minutes MINUTE);
  
  -- Loop untuk membuat schedule sampai waktu akhir
  WHILE v_current_time <= v_end_time DO
    INSERT INTO `reward_schedules` (
      `staking_id`,
      `member_id`,
      `scheduled_time`,
      `reward_amount`,
      `status`,
      `created_at`,
      `updated_at`
    ) VALUES (
      p_staking_id,
      p_member_id,
      v_current_time,
      v_reward_amount,
      'pending',
      NOW(),
      NOW()
    );
    
    SET v_count = v_count + 1;
    
    -- Tambahkan interval untuk schedule berikutnya
    SET v_current_time = DATE_ADD(v_current_time, INTERVAL p_reward_interval_minutes MINUTE);
    
    -- Safety limit: maksimal 10000 schedule per staking
    IF v_count >= 10000 THEN
      LEAVE;
    END IF;
  END WHILE;
  
  SELECT CONCAT('Generated ', v_count, ' reward schedules') AS result;
  
END$$

DELIMITER ;

-- Contoh penggunaan:
-- CALL generate_reward_schedules(
--   1,                    -- staking_id
--   1,                    -- member_id
--   '2026-01-24 05:04:28', -- staked_at
--   10,                   -- duration_minutes
--   0.5,                  -- reward_percentage
--   100.0,                -- coin_amount
--   1                     -- reward_interval_minutes
-- );

