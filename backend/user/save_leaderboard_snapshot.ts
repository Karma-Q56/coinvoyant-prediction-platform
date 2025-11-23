import { api } from "encore.dev/api";
import { userDB } from "./db";

interface SaveSnapshotResponse {
  message: string;
  streaksSaved: number;
  ptHoldersSaved: number;
  monthYear: string;
}

export const saveLeaderboardSnapshot = api(
  { method: "POST", path: "/user/save-leaderboard-snapshot", expose: true },
  async (): Promise<SaveSnapshotResponse> => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthYear = lastMonth.toISOString().substring(0, 7);

    const topStreaks = await userDB.queryAll<{
      id: number;
      username: string;
      streak: number;
      pt_balance: number;
    }>`
      SELECT id, username, streak, pt_balance
      FROM users
      ORDER BY streak DESC, pt_balance DESC
      LIMIT 100
    `;

    const topPtHolders = await userDB.queryAll<{
      id: number;
      username: string;
      streak: number;
      pt_balance: number;
    }>`
      SELECT id, username, streak, pt_balance
      FROM users
      ORDER BY pt_balance DESC, streak DESC
      LIMIT 100
    `;

    let streaksSaved = 0;
    for (let i = 0; i < topStreaks.length; i++) {
      const user = topStreaks[i];
      await userDB.exec`
        INSERT INTO leaderboard_snapshots 
          (user_id, username, leaderboard_type, rank, streak, pt_balance, month_year)
        VALUES 
          (${user.id}, ${user.username}, 'streak', ${i + 1}, ${user.streak}, ${user.pt_balance}, ${monthYear})
        ON CONFLICT (user_id, leaderboard_type, month_year) 
        DO UPDATE SET 
          username = EXCLUDED.username,
          rank = EXCLUDED.rank,
          streak = EXCLUDED.streak,
          pt_balance = EXCLUDED.pt_balance
      `;
      streaksSaved++;
    }

    let ptHoldersSaved = 0;
    for (let i = 0; i < topPtHolders.length; i++) {
      const user = topPtHolders[i];
      await userDB.exec`
        INSERT INTO leaderboard_snapshots 
          (user_id, username, leaderboard_type, rank, streak, pt_balance, month_year)
        VALUES 
          (${user.id}, ${user.username}, 'pt_balance', ${i + 1}, ${user.streak}, ${user.pt_balance}, ${monthYear})
        ON CONFLICT (user_id, leaderboard_type, month_year) 
        DO UPDATE SET 
          username = EXCLUDED.username,
          rank = EXCLUDED.rank,
          streak = EXCLUDED.streak,
          pt_balance = EXCLUDED.pt_balance
      `;
      ptHoldersSaved++;
    }

    return {
      message: `Leaderboard snapshot saved for ${monthYear}`,
      streaksSaved,
      ptHoldersSaved,
      monthYear,
    };
  }
);
