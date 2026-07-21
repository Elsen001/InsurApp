-- Chat mesajlarına fayl/şəkil əlavəsi (base64 data URL kimi saxlanır)
-- Qeyd: TiDB üçün ALTER-lər ayrı-ayrı
USE insurance_db;

ALTER TABLE chat_messages MODIFY COLUMN body TEXT NULL;

ALTER TABLE chat_messages ADD COLUMN attachment_url MEDIUMTEXT NULL;

ALTER TABLE chat_messages ADD COLUMN attachment_name VARCHAR(255) NULL;

ALTER TABLE chat_messages ADD COLUMN attachment_type VARCHAR(100) NULL;
