CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  prediction_id BIGINT NOT NULL REFERENCES predictions(id),
  option_selected VARCHAR(255) NOT NULL,
  pt_spent INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, prediction_id)
);

CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_prediction_id ON votes(prediction_id);
