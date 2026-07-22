-- Agent/subagent mobil nömrəsi
USE insurance_db;

ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER filial;
