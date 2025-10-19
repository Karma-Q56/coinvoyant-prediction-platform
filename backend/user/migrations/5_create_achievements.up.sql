CREATE TABLE achievements (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  badge_icon VARCHAR(100),
  token_reward INTEGER NOT NULL DEFAULT 0,
  is_monthly BOOLEAN NOT NULL DEFAULT FALSE,
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  month_year VARCHAR(7),
  UNIQUE(user_id, achievement_id, month_year)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_month_year ON user_achievements(month_year);

-- Insert default achievements
INSERT INTO achievements (code, name, description, badge_icon, token_reward, is_monthly, requirement_type, requirement_value) VALUES
  ('first_prediction', 'First Prediction', 'Make your first prediction', '🎯', 10, false, 'predictions', 1),
  ('10_predictions', '10 Predictions', 'Make 10 predictions', '🔟', 25, false, 'predictions', 10),
  ('50_predictions', '50 Predictions', 'Make 50 predictions', '⭐', 50, false, 'predictions', 50),
  ('100_predictions', '100 Predictions', 'Make 100 predictions', '💯', 100, false, 'predictions', 100),
  ('first_h2h_win', 'First Head2Head Win', 'Win your first head-to-head challenge', '🏆', 20, false, 'h2h_wins', 1),
  ('5_h2h_wins', '5 Head2Head Wins', 'Win 5 head-to-head challenges', '🥇', 50, false, 'h2h_wins', 5),
  ('10_h2h_wins', '10 Head2Head Wins', 'Win 10 head-to-head challenges', '👑', 100, false, 'h2h_wins', 10),
  ('accuracy_king', 'Accuracy King', 'Achieve 80% accuracy with at least 20 predictions', '🎓', 75, false, 'accuracy', 80),
  ('monthly_active', 'Monthly Active', 'Make at least 20 predictions this month', '📅', 30, true, 'monthly_predictions', 20),
  ('monthly_h2h_master', 'Monthly H2H Master', 'Win 10 head-to-head challenges this month', '⚔️', 50, true, 'monthly_h2h_wins', 10);
