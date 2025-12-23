import { api } from "encore.dev/api";
import { userDB } from "./db";

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
  earned: boolean;
  earnedAt: Date | null;
}

interface ListAchievementsRequest {
  userId: number;
}

interface ListAchievementsResponse {
  achievements: Achievement[];
}

export const listAchievements = api(
  { method: "GET", path: "/user/achievements/:userId", expose: true },
  async (req: ListAchievementsRequest): Promise<ListAchievementsResponse> => {
    const userId = req.userId;

    const currentMonth = new Date().toISOString().substring(0, 7);

    const achievements = await userDB.queryAll<Achievement>`
      SELECT 
        a.id,
        a.code,
        a.name,
        a.description,
        a.badge_icon as "badgeIcon",
        a.token_reward as "tokenReward",
        a.is_monthly as "isMonthly",
        a.requirement_type as "requirementType",
        a.requirement_value as "requirementValue",
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as earned,
        ua.earned_at as "earnedAt"
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
        AND ua.user_id = ${userId}
        AND (ua.month_year IS NULL OR ua.month_year = ${currentMonth})
      ORDER BY a.is_monthly DESC, a.requirement_value ASC
    `;

    return { achievements };
  }
);
