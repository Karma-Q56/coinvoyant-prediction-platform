import { userDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const challengeDB = SQLDatabase.named("challenge");

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  badgeIcon: string | null;
  tokenReward: number;
  isMonthly: boolean;
  requirementType: string;
  requirementValue: number;
}

export interface CheckAchievementsResult {
  newAchievements: Achievement[];
  tokensEarned: number;
}

export async function checkAchievementsForUser(userId: number): Promise<CheckAchievementsResult> {
  const user = await userDB.queryRow<{
    total_wins: number;
    total_losses: number;
    head2head_wins: number;
    accuracy_percentage: number;
  }>`
    SELECT total_wins, total_losses, head2head_wins, accuracy_percentage
    FROM users WHERE id = ${userId}
  `;

  if (!user) {
    console.error(`User ${userId} not found`);
    return { newAchievements: [], tokensEarned: 0 };
  }

  const totalPredictions = user.total_wins + user.total_losses;
  const currentMonth = new Date().toISOString().substring(0, 7);

  const monthlyStats = await userDB.queryRow<{
    monthly_predictions: number;
    monthly_h2h_wins: number;
  }>`
    SELECT 
      COUNT(DISTINCT v.prediction_id) as monthly_predictions,
      (SELECT COUNT(*) FROM challenges c 
       WHERE c.winner_id = ${userId} 
       AND DATE_TRUNC('month', c.resolved_at) = DATE_TRUNC('month', NOW())) as monthly_h2h_wins
    FROM votes v
    WHERE v.user_id = ${userId}
    AND DATE_TRUNC('month', v.created_at) = DATE_TRUNC('month', NOW())
  `;

  const userStats = {
    predictions: totalPredictions,
    h2h_wins: user.head2head_wins,
    accuracy: Number(user.accuracy_percentage),
    monthly_predictions: monthlyStats?.monthly_predictions || 0,
    monthly_h2h_wins: monthlyStats?.monthly_h2h_wins || 0,
  };

  const achievements = await userDB.queryAll<Achievement>`
    SELECT id, code, name, description, badge_icon as "badgeIcon", 
           token_reward as "tokenReward", is_monthly as "isMonthly",
           requirement_type as "requirementType", requirement_value as "requirementValue"
    FROM achievements
  `;

  const earnedAchievementIds = await userDB.queryAll<{ achievement_id: number }>`
    SELECT achievement_id FROM user_achievements 
    WHERE user_id = ${userId}
    AND (month_year IS NULL OR month_year = ${currentMonth})
  `;

  const earnedIds = new Set(earnedAchievementIds.map(a => a.achievement_id));
  const newAchievements: Achievement[] = [];
  let tokensEarned = 0;

  for (const achievement of achievements) {
    if (earnedIds.has(achievement.id)) continue;

    let earned = false;
    const statKey = achievement.requirementType;
    const userValue = userStats[statKey as keyof typeof userStats] || 0;

    if (userValue >= achievement.requirementValue) {
      earned = true;
    }

    if (earned) {
      await userDB.exec`
        INSERT INTO user_achievements (user_id, achievement_id, month_year)
        VALUES (${userId}, ${achievement.id}, ${achievement.isMonthly ? currentMonth : null})
      `;

      await userDB.exec`
        UPDATE users SET pt_balance = pt_balance + ${achievement.tokenReward}
        WHERE id = ${userId}
      `;

      newAchievements.push(achievement);
      tokensEarned += achievement.tokenReward;
    }
  }

  return { newAchievements, tokensEarned };
}
