-- Polisə konkret sığorta məhsulu (sub-type) — filtr üçün
-- Qeyd: TiDB üçün ALTER-lər ayrı-ayrı
USE insurance_db;
ALTER TABLE policies ADD COLUMN product VARCHAR(100) NULL AFTER type;
ALTER TABLE policies ADD COLUMN product_label VARCHAR(255) NULL AFTER product;
