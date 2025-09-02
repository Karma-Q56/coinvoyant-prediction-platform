import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const predictionDB = SQLDatabase.named("prediction");

export interface GetDashboardRequest {
  userId: number;
}

export interface TrendingPrediction {
  id: number;
  question: string;
  category: string;
  totalVotes: number;
  imageUrl?: string;
  predictionType: string;
  closesAt: Date;
}

export interface UserStats {
  currentStreak: number;
  totalPredictions: number;
  totalWins: number;
  winRate: number;
  ptBalance: number;
  etBalance: number;
}

export interface RecentActivity {
  type: string;
  description: string;
  amount?: number;
  currency?: string;
  createdAt: Date;
}

export interface DashboardResponse {
  userStats: UserStats;
  trendingPredictions: TrendingPrediction[];
  recentActivity: RecentActivity[];
  canClaimDailyBonus: boolean;
}

// Gets dashboard data for a user.
export const getDashboard = api<GetDashboardRequest, DashboardResponse>(
  { expose: true, method: "GET", path: "/user/:userId/dashboard" },
  async (req) => {
    // Get user stats
    const user = await userDB.queryRow<{
      streak: number;
      pt_balance: number;
      et_balance: number;
      last_login_bonus: Date | null;
    }>`
      SELECT streak, pt_balance, et_balance, last_login_bonus
      FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    // Get user prediction stats
    const predictionStats = await predictionDB.queryRow<{
      total_predictions: number;
      total_wins: number;
    }>`
      SELECT 
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN p.status = 'resolved' AND p.correct_option = v.option_selected THEN 1 END) as total_wins
      FROM votes v
      JOIN predictions p ON v.prediction_id = p.id
      WHERE v.user_id = ${req.userId}
    `;

    const totalPredictions = predictionStats?.total_predictions || 0;
    const totalWins = predictionStats?.total_wins || 0;
    const winRate = totalPredictions > 0 ? Math.round((totalWins / totalPredictions) * 100) : 0;

    // Get trending predictions (most voted open predictions)
    const trendingPredictions = await predictionDB.queryAll<{
      id: number;
      question: string;
      category: string;
      image_url: string | null;
      prediction_type: string;
      closes_at: Date;
      vote_count: number;
    }>`
      SELECT p.id, p.question, p.category, p.image_url, p.prediction_type, p.closes_at,
             COALESCE(vote_counts.vote_count, 0) as vote_count
      FROM predictions p
      LEFT JOIN (
        SELECT prediction_id, COUNT(*) as vote_count
        FROM votes
        GROUP BY prediction_id
      ) vote_counts ON p.id = vote_counts.prediction_id
      WHERE p.status = 'open' AND p.closes_at > NOW()
      ORDER BY vote_counts.vote_count DESC, p.created_at DESC
      LIMIT 5
    `;

    // Get recent activity
    const recentActivity = await userDB.queryAll<{
      type: string;
      amount: number;
      currency: string;
      description: string;
      created_at: Date;
    }>`
      SELECT type, amount, currency, description, created_at
      FROM transactions
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    // Check if can claim daily bonus
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let canClaimDailyBonus = true;
    
    if (user.last_login_bonus) {
      const lastClaimedDate = new Date(user.last_login_bonus);
      const lastClaimedDay = new Date(lastClaimedDate.getFullYear(), lastClaimedDate.getMonth(), lastClaimedDate.getDate());
      
      if (lastClaimedDay.getTime() === today.getTime()) {
        canClaimDailyBonus = false;
      }
    }

    return {
      userStats: {
        currentStreak: user.streak,
        totalPredictions,
        totalWins,
        winRate,
        ptBalance: user.pt_balance,
        etBalance: user.et_balance,
      },
      trendingPredictions: trendingPredictions.map(p => ({
        id: p.id,
        question: p.question,
        category: p.category,
        totalVotes: p.vote_count,
        imageUrl: p.image_url || undefined,
        predictionType: p.prediction_type,
        closesAt: p.closes_at,
      })),
      recentActivity: recentActivity.map(a => ({
        type: a.type,
        description: a.description,
        amount: a.amount,
        currency: a.currency,
        createdAt: a.created_at,
      })),
      canClaimDailyBonus,
    };
  }
);
