ALTER TABLE predictions ADD COLUMN odds JSONB;

CREATE INDEX idx_predictions_odds ON predictions USING gin(odds);
