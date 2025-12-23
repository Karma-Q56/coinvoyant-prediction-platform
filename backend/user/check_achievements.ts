import { api } from "encore.dev/api";
import { userDB } from "./db";
import { checkAchievementsForUser } from "./check_achievements_internal";

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

interface UserAchievement {
  achievement: Achievement;
  earnedAt: Date;
  monthYear: string | null;
}

interface CheckAchievementsRequest {
  userId: number;
}

interface CheckAchievementsResponse {
  newAchievements: Achievement[];
  tokensEarned: number;
}

export const checkAchievements = api(
  { method: "POST", path: "/user/check-achievements", expose: true },
  async (req: CheckAchievementsRequest): Promise<CheckAchievementsResponse> => {
    return await checkAchievementsForUser(req.userId);
  }
);
