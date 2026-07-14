-- Agent/subagent üçün İcbari və Könüllü şirkət seçimləri
USE insurance_db;
ALTER TABLE users ADD COLUMN companies JSON NULL AFTER commission_rate;
