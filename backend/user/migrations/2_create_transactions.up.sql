CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'purchase', 'bonus', 'vote', 'win', 'sweepstakes'
  amount INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL, -- 'ET' or 'PT'
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
