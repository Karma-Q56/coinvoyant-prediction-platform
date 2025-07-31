CREATE TABLE sweepstakes (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prize VARCHAR(255) NOT NULL,
  entry_cost INTEGER NOT NULL DEFAULT 0, -- Cost in ET, 0 for free
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  draw_date TIMESTAMP,
  winner_id BIGINT
);

CREATE INDEX idx_sweepstakes_is_open ON sweepstakes(is_open);
CREATE INDEX idx_sweepstakes_draw_date ON sweepstakes(draw_date);
