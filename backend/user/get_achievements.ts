import { api } from "encore.dev/api";
import { userDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const predictionDB = SQLDatabase.named("prediction");

export interface GetAchievementsRequest {
  userId: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface GetAchievementsResponse {
  achievements: Achievement[];
}

// Gets all achievements for a user with their progress.
export const getAchievements = api<GetAchievementsRequest, GetAchievementsResponse>(
  { expose: true, method: "GET", path: "/user/:userId/achievements" },
  async (req) => {
    // Get user stats
    const user = await userDB.queryRow<{
      streak: number;
      pt_balance: number;
      et_balance: number;
      consecutive_login_days: number;
      created_at: Date;
    }>`
      SELECT streak, pt_balance, et_balance, consecutive_login_days, created_at
      FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      return { achievements: [] };
    }

    // Get prediction stats
    const predictionStats = await predictionDB.queryRow<{
      total_predictions: number;
      total_wins: number;
      total_pt_won: number;
      max_streak: number;
    }>`
      SELECT 
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN p.status = 'resolved' AND p.correct_option = v.option_selected THEN 1 END) as total_wins,
        COALESCE(SUM(CASE WHEN p.status = 'resolved' AND p.correct_option = v.option_selected THEN v.pt_spent * 2 END), 0) as total_pt_won,
        ${user.streak} as max_streak
      FROM votes v
      JOIN predictions p ON v.prediction_id = p.id
      WHERE v.user_id = ${req.userId}
    `;

    const stats = predictionStats || {
      total_predictions: 0,
      total_wins: 0,
      total_pt_won: 0,
      max_streak: user.streak,
    };

    // Calculate account age in days
    const accountAgeDays = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

    // Define all achievements
    const achievementDefinitions = [
      // Prediction achievements
      {
        id: "first_prediction",
        name: "First Steps",
        description: "Make your first prediction",
        icon: "🎯",
        category: "Predictions",
        requirement: 1,
        progress: stats.total_predictions,
      },
      {
        id: "prediction_rookie",
        name: "Rookie Predictor",
        description: "Make 10 predictions",
        icon: "📈",
        category: "Predictions",
        requirement: 10,
        progress: stats.total_predictions,
      },
      {
        id: "prediction_veteran",
        name: "Veteran Predictor",
        description: "Make 50 predictions",
        icon: "🏆",
        category: "Predictions",
        requirement: 50,
        progress: stats.total_predictions,
      },
      {
        id: "prediction_master",
        name: "Master Predictor",
        description: "Make 100 predictions",
        icon: "👑",
        category: "Predictions",
        requirement: 100,
        progress: stats.total_predictions,
      },

      // Win achievements
      {
        id: "first_win",
        name: "Lucky Guess",
        description: "Win your first prediction",
        icon: "🍀",
        category: "Wins",
        requirement: 1,
        progress: stats.total_wins,
      },
      {
        id: "win_streak_3",
        name: "Hot Streak",
        description: "Win 3 predictions in a row",
        icon: "🔥",
        category: "Wins",
        requirement: 3,
        progress: stats.max_streak,
      },
      {
        id: "win_streak_5",
        name: "On Fire",
        description: "Win 5 predictions in a row",
        icon: "🌟",
        category: "Wins",
        requirement: 5,
        progress: stats.max_streak,
      },
      {
        id: "win_streak_10",
        name: "Unstoppable",
        description: "Win 10 predictions in a row",
        icon: "⚡",
        category: "Wins",
        requirement: 10,
        progress: stats.max_streak,
      },

      // PT achievements
      {
        id: "pt_collector",
        name: "Token Collector",
        description: "Accumulate 1,000 PT",
        icon: "🔮",
        category: "Wealth",
        requirement: 1000,
        progress: user.pt_balance,
      },
      {
        id: "pt_hoarder",
        name: "Token Hoarder",
        description: "Accumulate 5,000 PT",
        icon: "💎",
        category: "Wealth",
        requirement: 5000,
        progress: user.pt_balance,
      },
      {
        id: "pt_mogul",
        name: "Token Mogul",
        description: "Accumulate 10,000 PT",
        icon: "💰",
        category: "Wealth",
        requirement: 10000,
        progress: user.pt_balance,
      },

      // Login achievements
      {
        id: "daily_user",
        name: "Daily User",
        description: "Log in for 7 consecutive days",
        icon: "📅",
        category: "Loyalty",
        requirement: 7,
        progress: user.consecutive_login_days,
      },
      {
        id: "dedicated_user",
        name: "Dedicated User",
        description: "Log in for 30 consecutive days",
        icon: "🎖️",
        category: "Loyalty",
        requirement: 30,
        progress: user.consecutive_login_days,
      },

      // Time-based achievements
      {
        id: "veteran_member",
        name: "Veteran Member",
        description: "Be a member for 30 days",
        icon: "🏅",
        category: "Loyalty",
        requirement: 30,
        progress: accountAgeDays,
      },

      // Special achievements
      {
        id: "big_winner",
        name: "Big Winner",
        description: "Win 1,000 PT in total",
        icon: "💫",
        category: "Special",
        requirement: 1000,
        progress: stats.total_pt_won,
      },
      {
        id: "perfect_ten",
        name: "Perfect Ten",
        description: "Win 10 predictions",
        icon: "✨",
        category: "Wins",
        requirement: 10,
        progress: stats.total_wins,
      },
    ];

    const achievements: Achievement[] = achievementDefinitions.map(def => ({
      ...def,
      unlocked: def.progress >= def.requirement,
      unlockedAt: def.progress >= def.requirement ? new Date() : undefined,
    }));

    return { achievements };
  }
);
