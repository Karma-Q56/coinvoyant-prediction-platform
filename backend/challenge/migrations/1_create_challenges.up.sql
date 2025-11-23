CREATE TABLE challenges (
  id BIGSERIAL PRIMARY KEY,
  prediction_id BIGINT NOT NULL,
  challenger_id BIGINT NOT NULL,
  opponent_id BIGINT,
  challenger_stake INTEGER NOT NULL,
  opponent_stake INTEGER,
  challenger_choice BOOLEAN NOT NULL,
  opponent_choice BOOLEAN,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  winner_id BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX idx_challenges_opponent_id ON challenges(opponent_id);
CREATE INDEX idx_challenges_prediction_id ON challenges(prediction_id);
CREATE INDEX idx_challenges_status ON challenges(status);
