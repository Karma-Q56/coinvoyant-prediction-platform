CREATE TABLE leaderboard_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  username VARCHAR(255) NOT NULL,
  leaderboard_type VARCHAR(50) NOT NULL,
  rank INT NOT NULL,
  streak INT NOT NULL,
  pt_balance INT NOT NULL,
  month_year VARCHAR(7) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, leaderboard_type, month_year)
);

CREATE INDEX idx_snapshots_month_type ON leaderboard_snapshots(month_year, leaderboard_type, rank);
CREATE INDEX idx_snapshots_user ON leaderboard_snapshots(user_id, month_year);
