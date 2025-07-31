CREATE TABLE sweepstakes_entries (
  id BIGSERIAL PRIMARY KEY,
  sweepstakes_id BIGINT NOT NULL REFERENCES sweepstakes(id),
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entries_sweepstakes_id ON sweepstakes_entries(sweepstakes_id);
CREATE INDEX idx_entries_user_id ON sweepstakes_entries(user_id);
