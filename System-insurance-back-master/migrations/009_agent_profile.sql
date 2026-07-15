-- Agent profili: ünvan, vəzifə, filial/nümayəndəlik
-- Qeyd: TiDB eyni ALTER-də yaradılan sütuna AFTER ilə istinad edə bilmir — ayrı-ayrı icra olunur
USE insurance_db;

ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL AFTER name;
ALTER TABLE users ADD COLUMN vezife VARCHAR(255) NULL AFTER address;
ALTER TABLE users ADD COLUMN filial VARCHAR(255) NULL AFTER vezife;
