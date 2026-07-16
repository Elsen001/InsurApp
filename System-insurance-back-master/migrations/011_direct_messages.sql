-- Şəxsi mesajlar (inbox): recipient_id NULL olanda ümumi söhbətdir
-- Qeyd: TiDB üçün ALTER-lər ayrı-ayrı
USE insurance_db;

ALTER TABLE chat_messages ADD COLUMN recipient_id INT NULL;

ALTER TABLE chat_messages
  ADD CONSTRAINT fk_chat_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_chat_recipient ON chat_messages(recipient_id);
