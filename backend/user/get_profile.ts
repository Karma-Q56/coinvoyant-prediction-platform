import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface GetProfileRequest {
  userId: number;
}

export interface ProfileResponse {
  id: number;
  email: string;
  username: string;
  ptBalance: number;
  etBalance: number;
  streak: number;
  joinDate: Date;
  totalPredictions: number;
  totalWins: number;
}

// Gets a user's profile information.
export const getProfile = api<GetProfileRequest, ProfileResponse>(
  { expose: true, method: "GET", path: "/user/:userId/profile" },
  async (req) => {
    const user = await userDB.queryRow<{
      id: number;
      email: string;
      username: string;
      pt_balance: number;
      et_balance: number;
      streak: number;
      join_date: Date;
    }>`
      SELECT id, email, username, pt_balance, et_balance, streak, join_date
      FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    // Get prediction stats (placeholder for now)
    const totalPredictions = 0;
    const totalWins = 0;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      ptBalance: user.pt_balance,
      etBalance: user.et_balance,
      streak: user.streak,
      joinDate: user.join_date,
      totalPredictions,
      totalWins,
    };
  }
);
