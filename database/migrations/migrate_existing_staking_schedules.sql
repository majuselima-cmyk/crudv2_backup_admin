-- Migration: Generate reward schedules untuk staking yang sudah ada
-- Description: Membuat schedule untuk semua staking yang sudah ada di database

DELIMITER $$

-- Procedure untuk migrate existing staking
DROP PROCEDURE IF EXISTS `migrate_existing_staking_schedules`$$

CREATE PROCEDURE `migrate_existing_staking_schedules`()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_staking_id BIGINT UNSIGNED;
  DECLARE v_member_id BIGINT UNSIGNED;
  DECLARE v_staked_at DATETIME;
  DECLARE v_duration_minutes INT;
  DECLARE v_reward_percentage DECIMAL(5, 2);
  DECLARE v_coin_amount DECIMAL(20, 8);
  DECLARE v_reward_interval_minutes INT;
  DECLARE v_reward_amount DECIMAL(20, 8);
  DECLARE v_start_time DATETIME;
  DECLARE v_end_time DATETIME;
  DECLARE v_current_time DATETIME;
  DECLARE v_schedule_count INT DEFAULT 0;
  
  -- Cursor untuk semua staking yang aktif atau sudah unstaked
  DECLARE staking_cursor CURSOR FOR
    SELECT 
      s.id,
      s.member_id,
      s.staked_at,
      s.duration_minutes,
      s.reward_percentage,
      s.coin_amount,
      COALESCE(b.reward_interval_minutes, 240) AS reward_interval_minutes
    FROM stakings s
    LEFT JOIN bonus_settings b ON 1=1
    WHERE s.status IN ('active', 'unstaked')
    ORDER BY s.id;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Ambil reward interval dari bonus settings (default 240 menit)
  SELECT COALESCE(reward_interval_minutes, 240) INTO v_reward_interval_minutes
  FROM bonus_settings
  LIMIT 1;
  
  OPEN staking_cursor;
  
  read_loop: LOOP
    FETCH staking_cursor INTO 
      v_staking_id,
      v_member_id,
      v_staked_at,
      v_duration_minutes,
      v_reward_percentage,
      v_coin_amount,
      v_reward_interval_minutes;
    
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Skip jika sudah ada schedule untuk staking ini
    IF EXISTS (SELECT 1 FROM reward_schedules WHERE staking_id = v_staking_id LIMIT 1) THEN
      ITERATE read_loop;
    END IF;
    
    -- Hitung reward amount per interval
    SET v_reward_amount = (v_coin_amount * v_reward_percentage) / 100;
    
    -- Set waktu mulai dan akhir
    SET v_start_time = v_staked_at;
    SET v_end_time = DATE_ADD(v_staked_at, INTERVAL v_duration_minutes MINUTE);
    
    -- Waktu reward pertama adalah setelah interval pertama
    SET v_current_time = DATE_ADD(v_start_time, INTERVAL v_reward_interval_minutes MINUTE);
    
    -- Loop untuk membuat schedule sampai waktu akhir
    WHILE v_current_time <= v_end_time DO
      -- Cek apakah sudah ada reward history untuk waktu ini
      SET @reward_status = 'pending';
      SET @reward_history_id = NULL;
      
      SELECT 
        id,
        status
      INTO 
        @reward_history_id,
        @reward_status
      FROM reward_history
      WHERE 
        staking_id = v_staking_id
        AND ABS(TIMESTAMPDIFF(SECOND, reward_date, v_current_time)) < 300
      LIMIT 1;
      
      INSERT INTO `reward_schedules` (
        `staking_id`,
        `member_id`,
        `scheduled_time`,
        `reward_amount`,
        `status`,
        `reward_history_id`,
        `created_at`,
        `updated_at`
      ) VALUES (
        v_staking_id,
        v_member_id,
        v_current_time,
        v_reward_amount,
        IF(@reward_history_id IS NOT NULL, IF(@reward_status = 'paid', 'paid', IF(@reward_status = 'failed', 'failed', 'pending')), 'pending'),
        @reward_history_id,
        NOW(),
        NOW()
      );
      
      SET v_schedule_count = v_schedule_count + 1;
      
      -- Tambahkan interval untuk schedule berikutnya
      SET v_current_time = DATE_ADD(v_current_time, INTERVAL v_reward_interval_minutes MINUTE);
    END WHILE;
    
  END LOOP;
  
  CLOSE staking_cursor;
  
  SELECT CONCAT('Generated ', v_schedule_count, ' reward schedules') AS result;
  
END$$

DELIMITER ;

-- Jalankan migration untuk existing staking
-- CALL migrate_existing_staking_schedules();

