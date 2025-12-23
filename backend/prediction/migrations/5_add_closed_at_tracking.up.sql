ALTER TABLE predictions ADD COLUMN closed_at TIMESTAMP;
ALTER TABLE predictions ADD COLUMN resolution_time_seconds INTEGER;

CREATE INDEX idx_predictions_closed_at ON predictions(closed_at) WHERE status = 'closed';
