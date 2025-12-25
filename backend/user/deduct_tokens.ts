import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface DeductTokensRequest {
  userId: number;
  amount: number;
  description: string;
}

export interface DeductTokensResponse {
  success: boolean;
  newBalance: number;
}

export const deductTokens = api<DeductTokensRequest, DeductTokensResponse>(
  { method: "POST", path: "/user/deduct-tokens", expose: false },
  async (req) => {
    const user = await userDB.queryRow<{ pt_balance: number }>`
      SELECT pt_balance FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    if (user.pt_balance < req.amount) {
      throw APIError.invalidArgument("Insufficient tokens");
    }

    await userDB.exec`
      UPDATE users SET pt_balance = pt_balance - ${req.amount} WHERE id = ${req.userId}
    `;

    await userDB.exec`
      INSERT INTO transactions (user_id, amount, type, description)
      VALUES (${req.userId}, ${-req.amount}, 'deduction', ${req.description})
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
