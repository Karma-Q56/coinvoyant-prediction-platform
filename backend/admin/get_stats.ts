import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const userDB = SQLDatabase.named("user");
const predictionDB = SQLDatabase.named("prediction");
const sweepstakesDB = SQLDatabase.named("sweepstakes");

export interface AdminStatsResponse {
  totalUsers: number;
  activePredictions: number;
  totalEtInCirculation: number;
  totalPtInCirculation: number;
  openSweepstakes: number;
}

// Gets admin dashboard statistics.
export const getStats = api<void, AdminStatsResponse>(
  { expose: true, method: "GET", path: "/admin/stats" },
  async () => {
    const [userStats, predictionStats, sweepstakesStats] = await Promise.all([
      userDB.queryRow<{
        total_users: number;
        total_et: number;
        total_pt: number;
      }>`
        SELECT COUNT(*) as total_users,
               COALESCE(SUM(et_balance), 0) as total_et,
               COALESCE(SUM(pt_balance), 0) as total_pt
        FROM users
      `,
      predictionDB.queryRow<{
        active_predictions: number;
      }>`
        SELECT COUNT(*) as active_predictions
        FROM predictions
        WHERE status = 'open'
      `,
      sweepstakesDB.queryRow<{
        open_sweepstakes: number;
      }>`
        SELECT COUNT(*) as open_sweepstakes
        FROM sweepstakes
        WHERE is_open = true
      `,
    ]);

    return {
      totalUsers: userStats?.total_users || 0,
      activePredictions: predictionStats?.active_predictions || 0,
      totalEtInCirculation: userStats?.total_et || 0,
      totalPtInCirculation: userStats?.total_pt || 0,
      openSweepstakes: sweepstakesStats?.open_sweepstakes || 0,
    };
  }
);
