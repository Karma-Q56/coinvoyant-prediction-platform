import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const sweepstakesDB = SQLDatabase.named("sweepstakes");
const userDB = SQLDatabase.named("user");

export interface CreateSweepstakesRequest {
  userId: number;
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

// List of admin email addresses
const ADMIN_EMAILS = [
  // Add your email address here
  "admin@example.com", // Replace with your actual email
];

// Creates a new sweepstakes (admin only).
export const createSweepstakes = api<CreateSweepstakesRequest, CreateSweepstakesResponse>(
  { expose: true, method: "POST", path: "/admin/sweepstakes" },
  async (req) => {
    // Check if user is admin
    const user = await userDB.queryRow<{
      email: string;
    }>`
      SELECT email FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      throw APIError.permissionDenied("admin access required");
    }

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
