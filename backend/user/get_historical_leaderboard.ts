import { api } from "encore.dev/api";
import { userDB } from "./db";

export interface HistoricalLeaderboardEntry {
  userId: number;
  username: string;
  rank: number;
  streak: number;
  ptBalance: number;
}

export interface GetHistoricalLeaderboardRequest {
  monthYear: string;
  leaderboardType: string;
}

export interface GetHistoricalLeaderboardResponse {
  entries: HistoricalLeaderboardEntry[];
  monthYear: string;
  leaderboardType: string;
}

export const getHistoricalLeaderboard = api(
  { method: "GET", path: "/user/historical-leaderboard/:monthYear/:leaderboardType", expose: true },
  async (req: GetHistoricalLeaderboardRequest): Promise<GetHistoricalLeaderboardResponse> => {
    const entries = await userDB.queryAll<{
      user_id: number;
      username: string;
      rank: number;
      streak: number;
      pt_balance: number;
    }>`
      SELECT user_id, username, rank, streak, pt_balance
      FROM leaderboard_snapshots
      WHERE month_year = ${req.monthYear}
        AND leaderboard_type = ${req.leaderboardType}
      ORDER BY rank ASC
    `;

    return {
      entries: entries.map(entry => ({
        userId: entry.user_id,
        username: entry.username,
        rank: entry.rank,
        streak: entry.streak,
        ptBalance: entry.pt_balance,
      })),
      monthYear: req.monthYear,
      leaderboardType: req.leaderboardType,
    };
  }
);
