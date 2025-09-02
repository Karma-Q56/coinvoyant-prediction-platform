ALTER TABLE users 
ADD COLUMN last_login_bonus TIMESTAMP,
ADD COLUMN consecutive_login_days INTEGER NOT NULL DEFAULT 0;

-- Update existing users to have the new starting balances (500 PT, 10 ET)
UPDATE users 
SET pt_balance = GREATEST(pt_balance, 500),
    et_balance = GREATEST(et_balance, 10)
WHERE pt_balance < 500 OR et_balance < 10;
