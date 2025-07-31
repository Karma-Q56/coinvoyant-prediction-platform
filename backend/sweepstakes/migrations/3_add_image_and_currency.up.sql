ALTER TABLE sweepstakes 
ADD COLUMN image_url TEXT,
ADD COLUMN entry_currency VARCHAR(10) NOT NULL DEFAULT 'ET'; -- 'ET' or 'PT'
