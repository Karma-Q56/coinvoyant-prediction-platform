import { api } from "encore.dev/api";
import { sweepstakesDB } from "./db";

export interface Sweepstakes {
  id: number;
  title: string;
  description: string;
  prize: string;
  entryCost: number;
  isOpen: boolean;
  createdAt: Date;
  drawDate?: Date;
  winnerId?: number;
  entryCount: number;
}

export interface ListSweepstakesResponse {
  sweepstakes: Sweepstakes[];
}

// Lists all available sweepstakes.
export const listSweepstakes = api<void, ListSweepstakesResponse>(
  { expose: true, method: "GET", path: "/sweepstakes" },
  async () => {
    const sweepstakes = await sweepstakesDB.queryAll<{
      id: number;
      title: string;
      description: string;
      prize: string;
      entry_cost: number;
      is_open: boolean;
      created_at: Date;
      draw_date: Date | null;
      winner_id: number | null;
    }>`
      SELECT id, title, description, prize, entry_cost, is_open,
             created_at, draw_date, winner_id
      FROM sweepstakes
      ORDER BY created_at DESC
    `;

    // Get entry counts
    const sweepstakesIds = sweepstakes.map(s => s.id);
    const entryCounts = new Map<number, number>();

    if (sweepstakesIds.length > 0) {
      const counts = await sweepstakesDB.queryAll<{
        sweepstakes_id: number;
        entry_count: number;
      }>`
        SELECT sweepstakes_id, COUNT(*) as entry_count
        FROM sweepstakes_entries
        WHERE sweepstakes_id = ANY(${sweepstakesIds})
        GROUP BY sweepstakes_id
      `;

      counts.forEach(count => {
        entryCounts.set(count.sweepstakes_id, count.entry_count);
      });
    }

    return {
      sweepstakes: sweepstakes.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description || '',
        prize: s.prize,
        entryCost: s.entry_cost,
        isOpen: s.is_open,
        createdAt: s.created_at,
        drawDate: s.draw_date || undefined,
        winnerId: s.winner_id || undefined,
        entryCount: entryCounts.get(s.id) || 0,
      })),
    };
  }
);
