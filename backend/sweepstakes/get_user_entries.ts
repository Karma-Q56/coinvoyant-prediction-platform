import { api } from "encore.dev/api";
import { sweepstakesDB } from "./db";

export interface GetUserEntriesRequest {
  userId: number;
}

export interface UserEntry {
  sweepstakesId: number;
  title: string;
  prize: string;
  entryCount: number;
  isWinner: boolean;
  createdAt: Date;
}

export interface GetUserEntriesResponse {
  entries: UserEntry[];
}

// Gets all sweepstakes entries for a user.
export const getUserEntries = api<GetUserEntriesRequest, GetUserEntriesResponse>(
  { expose: true, method: "GET", path: "/sweepstakes/user/:userId" },
  async (req) => {
    const entries = await sweepstakesDB.queryAll<{
      sweepstakes_id: number;
      title: string;
      prize: string;
      winner_id: number | null;
      entry_count: number;
      first_entry: Date;
    }>`
      SELECT s.id as sweepstakes_id, s.title, s.prize, s.winner_id,
             COUNT(se.id) as entry_count, MIN(se.created_at) as first_entry
      FROM sweepstakes s
      JOIN sweepstakes_entries se ON s.id = se.sweepstakes_id
      WHERE se.user_id = ${req.userId}
      GROUP BY s.id, s.title, s.prize, s.winner_id
      ORDER BY first_entry DESC
    `;

    return {
      entries: entries.map(entry => ({
        sweepstakesId: entry.sweepstakes_id,
        title: entry.title,
        prize: entry.prize,
        entryCount: entry.entry_count,
        isWinner: entry.winner_id === req.userId,
        createdAt: entry.first_entry,
      })),
    };
  }
);
