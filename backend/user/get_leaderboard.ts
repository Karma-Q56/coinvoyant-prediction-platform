import { api } from "encore.dev/api";
import { userDB } from "./db";

export interface LeaderboardEntry {
  id: number;
  username: string;
  streak: number;
  ptBalance: number;
  rank: number;
}

export interface GetLeaderboardResponse {
  topStreaks: LeaderboardEntry[];
  topPtHolders: LeaderboardEntry[];
}

// Gets the leaderboard data.
export const getLeaderboard = api<void, GetLeaderboardResponse>(
  { expose: true, method: "GET", path: "/user/leaderboard" },
  async () => {
    // Top streaks
    const topStreaks = await userDB.queryAll<{
      id: number;
      username: string;
      streak: number;
      pt_balance: number;
    }>`
      SELECT id, username, streak, pt_balance
      FROM users
      ORDER BY streak DESC, pt_balance DESC
      LIMIT 10
    `;

    // Top PT holders
    const topPtHolders = await userDB.queryAll<{
      id: number;
      username: string;
      streak: number;
      pt_balance: number;
    }>`
      SELECT id, username, streak, pt_balance
      FROM users
      ORDER BY pt_balance DESC, streak DESC
      LIMIT 10
    `;

    return {
      topStreaks: topStreaks.map((user, index) => ({
        id: user.id,
        username: user.username,
        streak: user.streak,
        ptBalance: user.pt_balance,
        rank: index + 1,
      })),
      topPtHolders: topPtHolders.map((user, index) => ({
        id: user.id,
        username: user.username,
        streak: user.streak,
        ptBalance: user.pt_balance,
        rank: index + 1,
      })),
    };
  }
);
