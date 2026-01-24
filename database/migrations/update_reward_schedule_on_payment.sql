-- Trigger atau Procedure untuk update reward_schedules ketika reward diberikan
-- Description: Update status schedule menjadi 'paid' ketika reward history dibuat

DELIMITER $$

-- Procedure untuk update reward schedule ketika reward diberikan
DROP PROCEDURE IF EXISTS `update_reward_schedule_on_payment`$$

CREATE PROCEDURE `update_reward_schedule_on_payment`(
  IN p_reward_history_id BIGINT UNSIGNED,
  IN p_staking_id BIGINT UNSIGNED,
  IN p_reward_date DATETIME,
  IN p_status VARCHAR(20)
)
BEGIN
  DECLARE v_schedule_id BIGINT UNSIGNED DEFAULT NULL;
  
  -- Cari schedule yang paling dekat dengan waktu reward (dalam 5 menit)
  SELECT `id`
  INTO v_schedule_id
  FROM `reward_schedules`
  WHERE 
    `staking_id` = p_staking_id
    AND `status` = 'pending'
    AND `scheduled_time` <= DATE_ADD(p_reward_date, INTERVAL 5 MINUTE)
    AND `scheduled_time` >= DATE_SUB(p_reward_date, INTERVAL 5 MINUTE)
  ORDER BY ABS(TIMESTAMPDIFF(SECOND, `scheduled_time`, p_reward_date))
  LIMIT 1;
  
  -- Update schedule jika ditemukan
  IF v_schedule_id IS NOT NULL THEN
    UPDATE `reward_schedules`
    SET 
      `status` = CASE 
        WHEN p_status = 'paid' THEN 'paid'
        WHEN p_status = 'failed' THEN 'failed'
        ELSE 'pending'
      END,
      `reward_history_id` = p_reward_history_id,
      `updated_at` = NOW()
    WHERE `id` = v_schedule_id;
  END IF;
  
END$$

DELIMITER ;

-- Trigger untuk otomatis update schedule ketika reward history dibuat
DROP TRIGGER IF EXISTS `trg_update_schedule_on_reward_created`$$

DELIMITER $$

CREATE TRIGGER `trg_update_schedule_on_reward_created`
AFTER INSERT ON `reward_history`
FOR EACH ROW
BEGIN
  IF NEW.staking_id IS NOT NULL THEN
    CALL update_reward_schedule_on_payment(
      NEW.id,
      NEW.staking_id,
      NEW.reward_date,
      NEW.status
    );
  END IF;
END$$

DELIMITER ;

-- Trigger untuk update schedule ketika reward history diupdate
DROP TRIGGER IF EXISTS `trg_update_schedule_on_reward_updated`$$

DELIMITER $$

CREATE TRIGGER `trg_update_schedule_on_reward_updated`
AFTER UPDATE ON `reward_history`
FOR EACH ROW
BEGIN
  IF NEW.staking_id IS NOT NULL AND (OLD.status != NEW.status OR OLD.staking_id != NEW.staking_id) THEN
    CALL update_reward_schedule_on_payment(
      NEW.id,
      NEW.staking_id,
      NEW.reward_date,
      NEW.status
    );
  END IF;
END$$

DELIMITER ;

