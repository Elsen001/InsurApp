-- Agent profili: ünvan, vəzifə, filial/nümayəndəlik
USE insurance_db;
ALTER TABLE users
  ADD COLUMN address VARCHAR(255) NULL AFTER name,
  ADD COLUMN vezife VARCHAR(255) NULL AFTER address,
  ADD COLUMN filial VARCHAR(255) NULL AFTER vezife;
