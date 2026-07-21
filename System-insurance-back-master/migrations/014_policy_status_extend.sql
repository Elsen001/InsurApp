-- Polis statusuna yeni vəziyyətlər: Qüvvəyə minəcək (upcoming), Xitam verilib (terminated)
USE insurance_db;

ALTER TABLE policies
  MODIFY COLUMN status ENUM('active','upcoming','expired','terminated','cancelled') NOT NULL DEFAULT 'active';
