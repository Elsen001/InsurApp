-- Subagent rolu + valideyn agent + agent/subagent bonusları
-- MySQL 8.0+

USE insurance_db;

-- users: subagent rolu və valideyn agent əlaqəsi
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'agent', 'subagent') NOT NULL DEFAULT 'agent';

-- Qeyd: TiDB eyni ALTER-də sütun əlavə edib ona FK qura bilmir — ayrı-ayrı icra olunur
ALTER TABLE users
  ADD COLUMN parent_agent_id INT NULL AFTER role;

ALTER TABLE users
  ADD CONSTRAINT fk_users_parent_agent
    FOREIGN KEY (parent_agent_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_parent_agent ON users(parent_agent_id);
CREATE INDEX idx_users_role ON users(role);

-- Bonuslar cədvəli: hər qeyd bir istifadəçi (agent/subagent) + sığorta məhsulu üçün
CREATE TABLE IF NOT EXISTS bonuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                    -- bonus təyin olunan agent/subagent
  product VARCHAR(100) NOT NULL,           -- sığorta məhsulunun dəyəri (məs. 'pasha_yuvam')
  product_label VARCHAR(255) NOT NULL,     -- oxunaqlı ad
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  note VARCHAR(255) NULL,
  created_by INT NULL,                     -- bonusu təyin edən admin
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bonus_user_product (user_id, product),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_bonuses_user ON bonuses(user_id);
