import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { predictionDB } from "../prediction/db";

const userDB = SQLDatabase.named("user");

export interface ResolutionMetrics {
  totalResolved: number;
  avgResolutionTimeHours: number;
  fastestResolutionHours: number;
  slowestResolutionHours: number;
  currentlyPending: number;
  resolvedLast24h: number;
  resolvedLast7d: number;
}

export const getResolutionMetrics = api(
  { method: "GET", path: "/admin/resolution-metrics", expose: true, auth: true },
  async (): Promise<ResolutionMetrics> => {
    const { userId } = (await import("~encore/auth")).getAuthData()!;

    const isAdminGen = await userDB.query<{ is_admin: boolean }>`
      SELECT is_admin FROM users WHERE id = ${userId}
    `;

    let isAdmin = false;
    for await (const row of isAdminGen) {
      isAdmin = row.is_admin;
    }

    if (!isAdmin) {
      throw new Error("Unauthorized");
    }

    const metricsGen = await predictionDB.query<{
      total_resolved: number;
      avg_resolution_seconds: number | null;
      fastest_resolution_seconds: number | null;
      slowest_resolution_seconds: number | null;
      currently_pending: number;
      resolved_last_24h: number;
      resolved_last_7d: number;
    }>`
      SELECT 
        COUNT(CASE WHEN status = 'resolved' AND resolution_time_seconds IS NOT NULL THEN 1 END) as total_resolved,
        AVG(resolution_time_seconds) as avg_resolution_seconds,
        MIN(resolution_time_seconds) as fastest_resolution_seconds,
        MAX(resolution_time_seconds) as slowest_resolution_seconds,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as currently_pending,
        COUNT(CASE WHEN status = 'resolved' AND resolved_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as resolved_last_24h,
        COUNT(CASE WHEN status = 'resolved' AND resolved_at >= NOW() - INTERVAL '7 days' THEN 1 END) as resolved_last_7d
      FROM predictions
    `;

    let metrics: ResolutionMetrics = {
      totalResolved: 0,
      avgResolutionTimeHours: 0,
      fastestResolutionHours: 0,
      slowestResolutionHours: 0,
      currentlyPending: 0,
      resolvedLast24h: 0,
      resolvedLast7d: 0,
    };

    for await (const row of metricsGen) {
      metrics = {
        totalResolved: Number(row.total_resolved),
        avgResolutionTimeHours: row.avg_resolution_seconds 
          ? Math.round(row.avg_resolution_seconds / 3600 * 10) / 10 
          : 0,
        fastestResolutionHours: row.fastest_resolution_seconds
          ? Math.round(row.fastest_resolution_seconds / 3600 * 10) / 10
          : 0,
        slowestResolutionHours: row.slowest_resolution_seconds
          ? Math.round(row.slowest_resolution_seconds / 3600 * 10) / 10
          : 0,
        currentlyPending: Number(row.currently_pending),
        resolvedLast24h: Number(row.resolved_last_24h),
        resolvedLast7d: Number(row.resolved_last_7d),
      };
    }

    return metrics;
  }
);
