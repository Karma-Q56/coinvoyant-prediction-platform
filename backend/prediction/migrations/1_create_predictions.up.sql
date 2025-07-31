CREATE TABLE predictions (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  options JSONB NOT NULL, -- Array of option strings
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'resolved'
  correct_option VARCHAR(255),
  required_pt INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closes_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_predictions_category ON predictions(category);
CREATE INDEX idx_predictions_closes_at ON predictions(closes_at);
