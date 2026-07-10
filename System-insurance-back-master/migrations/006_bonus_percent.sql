-- Bonus artıq sabit AZN yox, FAİZ-dir (satılan sığortanın premiumunun %-i)
USE insurance_db;

ALTER TABLE bonuses
  CHANGE COLUMN amount percent DECIMAL(5,2) NOT NULL DEFAULT 0.00;
