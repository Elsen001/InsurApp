-- Agent: FİN, Ş/V, ulduz reytinqi + Bildiriş: hədəf auditoriya
-- Qeyd: TiDB üçün ALTER-lər ayrı-ayrı icra olunur
USE insurance_db;

ALTER TABLE users ADD COLUMN fin VARCHAR(20) NULL AFTER filial;
ALTER TABLE users ADD COLUMN sv VARCHAR(50) NULL AFTER fin;
ALTER TABLE users ADD COLUMN rating TINYINT NOT NULL DEFAULT 0;

-- Bildiriş kimə göndərilir: all | agent | subagent
ALTER TABLE announcements ADD COLUMN audience VARCHAR(20) NOT NULL DEFAULT 'all';
