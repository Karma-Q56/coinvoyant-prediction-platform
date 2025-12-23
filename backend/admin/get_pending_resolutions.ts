import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { predictionDB } from "../prediction/db";

const userDB = SQLDatabase.named("user");

export interface PendingResolution {
  id: number;
  question: string;
  category: string;
  options: string[];
  closedAt: Date;
  hoursWaiting: number;
  totalVotes: number;
}

export interface PendingResolutionsResponse {
  predictions: PendingResolution[];
  count: number;
}

export const getPendingResolutions = api(
  { method: "GET", path: "/admin/pending-resolutions", expose: true, auth: true },
  async (): Promise<PendingResolutionsResponse> => {
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

    const pendingGen = await predictionDB.query<{
      id: number;
      question: string;
      category: string;
      options: string[];
      closed_at: Date;
      total_votes: number;
    }>`
      SELECT 
        p.id,
        p.question,
        p.category,
        p.options,
        p.closed_at,
        COUNT(v.id) as total_votes
      FROM predictions p
      LEFT JOIN votes v ON p.id = v.prediction_id
      WHERE p.status = 'closed'
      GROUP BY p.id, p.question, p.category, p.options, p.closed_at
      ORDER BY p.closed_at ASC
    `;

    const predictions: PendingResolution[] = [];
    for await (const row of pendingGen) {
      const hoursWaiting = Math.floor(
        (Date.now() - new Date(row.closed_at).getTime()) / (1000 * 60 * 60)
      );

      predictions.push({
        id: row.id,
        question: row.question,
        category: row.category,
        options: row.options,
        closedAt: row.closed_at,
        hoursWaiting,
        totalVotes: Number(row.total_votes),
      });
    }

    return {
      predictions,
      count: predictions.length,
    };
  }
);
