import { api } from "encore.dev/api";
import { userDB } from "./db";

export interface LeaderboardEntry {
  id: number;
  username: string;
  ptBalance: number;
  streak: number;
  totalWins: number;
  accuracyPercentage: number;
  head2headWins: number;
  rank: number;
}

export interface GetLeaderboardsResponse {
  freemiumLeaderboard: LeaderboardEntry[];
  premiumLeaderboard: LeaderboardEntry[];
  head2headLeaderboard: LeaderboardEntry[];
}

export const getLeaderboards = api<void, GetLeaderboardsResponse>(
  { expose: true, method: "GET", path: "/user/leaderboards" },
  async () => {
    const freemiumLeaderboard = await userDB.queryAll<{
      id: number;
      username: string;
      pt_balance: number;
      streak: number;
      total_wins: number;
      accuracy_percentage: number;
      head2head_wins: number;
    }>`
      SELECT id, username, pt_balance, streak, total_wins, accuracy_percentage, head2head_wins
      FROM users
      WHERE is_premium = false
      ORDER BY pt_balance DESC, total_wins DESC
      LIMIT 100
    `;

    const premiumLeaderboard = await userDB.queryAll<{
      id: number;
      username: string;
      pt_balance: number;
      streak: number;
      total_wins: number;
      accuracy_percentage: number;
      head2head_wins: number;
    }>`
      SELECT id, username, pt_balance, streak, total_wins, accuracy_percentage, head2head_wins
      FROM users
      WHERE is_premium = true
      ORDER BY pt_balance DESC, total_wins DESC
      LIMIT 100
    `;

    const head2headLeaderboard = await userDB.queryAll<{
      id: number;
      username: string;
      pt_balance: number;
      streak: number;
      total_wins: number;
      accuracy_percentage: number;
      head2head_wins: number;
    }>`
      SELECT id, username, pt_balance, streak, total_wins, accuracy_percentage, head2head_wins
      FROM users
      WHERE head2head_wins > 0
      ORDER BY head2head_wins DESC, pt_balance DESC
      LIMIT 100
    `;

    return {
      freemiumLeaderboard: freemiumLeaderboard.map((user, index) => ({
        id: user.id,
        username: user.username,
        ptBalance: user.pt_balance,
        streak: user.streak,
        totalWins: user.total_wins,
        accuracyPercentage: Number(user.accuracy_percentage),
        head2headWins: user.head2head_wins,
        rank: index + 1,
      })),
      premiumLeaderboard: premiumLeaderboard.map((user, index) => ({
        id: user.id,
        username: user.username,
        ptBalance: user.pt_balance,
        streak: user.streak,
        totalWins: user.total_wins,
        accuracyPercentage: Number(user.accuracy_percentage),
        head2headWins: user.head2head_wins,
        rank: index + 1,
      })),
      head2headLeaderboard: head2headLeaderboard.map((user, index) => ({
        id: user.id,
        username: user.username,
        ptBalance: user.pt_balance,
        streak: user.streak,
        totalWins: user.total_wins,
        accuracyPercentage: Number(user.accuracy_percentage),
        head2headWins: user.head2head_wins,
        rank: index + 1,
      })),
    };
  }
);
