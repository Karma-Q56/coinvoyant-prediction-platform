import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const sweepstakesDB = SQLDatabase.named("sweepstakes");

export interface CreateSweepstakesRequest {
  title: string;
  description: string;
  prize: string;
  entryCost: number;
  drawDate?: Date;
}

export interface CreateSweepstakesResponse {
  id: number;
  title: string;
  description: string;
  prize: string;
  entryCost: number;
  drawDate?: Date;
}

// Creates a new sweepstakes (admin only).
export const createSweepstakes = api<CreateSweepstakesRequest, CreateSweepstakesResponse>(
  { expose: true, method: "POST", path: "/admin/sweepstakes" },
  async (req) => {
    const sweepstakes = await sweepstakesDB.queryRow<{
      id: number;
      title: string;
      description: string;
      prize: string;
      entry_cost: number;
      draw_date: Date | null;
    }>`
      INSERT INTO sweepstakes (title, description, prize, entry_cost, draw_date)
      VALUES (${req.title}, ${req.description}, ${req.prize}, ${req.entryCost}, ${req.drawDate || null})
      RETURNING id, title, description, prize, entry_cost, draw_date
    `;

    return {
      id: sweepstakes!.id,
      title: sweepstakes!.title,
      description: sweepstakes!.description,
      prize: sweepstakes!.prize,
      entryCost: sweepstakes!.entry_cost,
      drawDate: sweepstakes!.draw_date || undefined,
    };
  }
);
