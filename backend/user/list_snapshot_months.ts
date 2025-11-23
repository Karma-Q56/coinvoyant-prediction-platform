import { api } from "encore.dev/api";
import { userDB } from "./db";

export interface SnapshotMonth {
  monthYear: string;
  streakCount: number;
  ptBalanceCount: number;
}

export interface ListSnapshotMonthsResponse {
  months: SnapshotMonth[];
}

export const listSnapshotMonths = api(
  { method: "GET", path: "/user/snapshot-months", expose: true },
  async (): Promise<ListSnapshotMonthsResponse> => {
    const months = await userDB.queryAll<{
      month_year: string;
      leaderboard_type: string;
      count: number;
    }>`
      SELECT month_year, leaderboard_type, COUNT(*) as count
      FROM leaderboard_snapshots
      GROUP BY month_year, leaderboard_type
      ORDER BY month_year DESC
    `;

    const monthMap = new Map<string, SnapshotMonth>();

    for (const month of months) {
      if (!monthMap.has(month.month_year)) {
        monthMap.set(month.month_year, {
          monthYear: month.month_year,
          streakCount: 0,
          ptBalanceCount: 0,
        });
      }

      const snapshot = monthMap.get(month.month_year)!;
      if (month.leaderboard_type === "streak") {
        snapshot.streakCount = month.count;
      } else if (month.leaderboard_type === "pt_balance") {
        snapshot.ptBalanceCount = month.count;
      }
    }

    return {
      months: Array.from(monthMap.values()),
    };
  }
);
