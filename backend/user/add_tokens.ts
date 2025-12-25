import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface AddTokensRequest {
  userId: number;
  amount: number;
  description: string;
}

export interface AddTokensResponse {
  success: boolean;
  newBalance: number;
}

export const addTokens = api<AddTokensRequest, AddTokensResponse>(
  { method: "POST", path: "/user/add-tokens", expose: false },
  async (req) => {
    const user = await userDB.queryRow<{ id: number }>`
      SELECT id FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    await userDB.exec`
      UPDATE users SET pt_balance = pt_balance + ${req.amount} WHERE id = ${req.userId}
    `;

    await userDB.exec`
      INSERT INTO transactions (user_id, amount, type, description)
      VALUES (${req.userId}, ${req.amount}, 'reward', ${req.description})
    `;

    const updated = await userDB.queryRow<{ pt_balance: number }>`
      SELECT pt_balance FROM users WHERE id = ${req.userId}
    `;

    return {
      success: true,
      newBalance: updated!.pt_balance,
    };
  }
);
