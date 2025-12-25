import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface IncrementH2HWinsRequest {
  userId: number;
}

export interface IncrementH2HWinsResponse {
  success: boolean;
}

export const incrementH2HWins = api<IncrementH2HWinsRequest, IncrementH2HWinsResponse>(
  { method: "POST", path: "/user/increment-h2h-wins", expose: false },
  async (req) => {
    const user = await userDB.queryRow<{ id: number }>`
      SELECT id FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    await userDB.exec`
      UPDATE users
      SET head2head_wins = head2head_wins + 1,
          updated_at = NOW()
      WHERE id = ${req.userId}
    `;

    return {
      success: true,
    };
  }
);
