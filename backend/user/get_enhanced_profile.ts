import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface GetEnhancedProfileRequest {
  userId: number;
}

export interface EnhancedProfileResponse {
  id: number;
  email: string;
  username: string;
  challengeId: string | null;
  ptBalance: number;
  etBalance: number;
  streak: number;
  joinDate: Date;
  isPremium: boolean;
  totalWins: number;
  totalLosses: number;
  accuracyPercentage: number;
  head2headWins: number;
  head2headLosses: number;
  totalPredictions: number;
  adsWatchedToday: number;
  achievements: {
    id: number;
    name: string;
    description: string;
    badgeIcon: string | null;
    earnedAt: Date;
  }[];
}

export const getEnhancedProfile = api<GetEnhancedProfileRequest, EnhancedProfileResponse>(
  { expose: true, method: "GET", path: "/user/:userId/enhanced-profile" },
  async (req) => {
    const user = await userDB.queryRow<{
      id: number;
      email: string;
      username: string;
      challenge_id: string | null;
      pt_balance: number;
      et_balance: number;
      streak: number;
      join_date: Date;
      is_premium: boolean;
      total_wins: number;
      total_losses: number;
      accuracy_percentage: number;
      head2head_wins: number;
      head2head_losses: number;
      ads_watched_today: number;
    }>`
      SELECT id, email, username, challenge_id, pt_balance, et_balance, streak, join_date,
             is_premium, total_wins, total_losses, accuracy_percentage, 
             head2head_wins, head2head_losses, ads_watched_today
      FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    const achievements = await userDB.queryAll<{
      id: number;
      name: string;
      description: string;
      badge_icon: string | null;
      earned_at: Date;
    }>`
      SELECT a.id, a.name, a.description, a.badge_icon, ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ${req.userId}
      ORDER BY ua.earned_at DESC
    `;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      challengeId: user.challenge_id,
      ptBalance: user.pt_balance,
      etBalance: user.et_balance,
      streak: user.streak,
      joinDate: user.join_date,
      isPremium: user.is_premium,
      totalWins: user.total_wins,
      totalLosses: user.total_losses,
      accuracyPercentage: Number(user.accuracy_percentage),
      head2headWins: user.head2head_wins,
      head2headLosses: user.head2head_losses,
      totalPredictions: user.total_wins + user.total_losses,
      adsWatchedToday: user.ads_watched_today,
      achievements: achievements.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        badgeIcon: a.badge_icon,
        earnedAt: a.earned_at,
      })),
    };
  }
);
