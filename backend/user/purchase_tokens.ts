import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface PurchaseTokensRequest {
  userId: number;
  amount: number; // Amount in dollars
}

export interface PurchaseTokensResponse {
  etAdded: number;
  ptAdded: number;
  newEtBalance: number;
  newPtBalance: number;
}

// Processes a token purchase (ET + bonus PT).
export const purchaseTokens = api<PurchaseTokensRequest, PurchaseTokensResponse>(
  { expose: true, method: "POST", path: "/user/purchase-tokens" },
  async (req) => {
    if (req.amount <= 0) {
      throw APIError.invalidArgument("amount must be positive");
    }

    const etToAdd = req.amount * 100; // $1 = 100 ET
    const ptToAdd = req.amount * 10;  // $1 = 10 PT bonus

    // Start transaction
    const tx = await userDB.begin();
    try {
      // Update user balances
      const updatedUser = await tx.queryRow<{
        et_balance: number;
        pt_balance: number;
      }>`
        UPDATE users 
        SET et_balance = et_balance + ${etToAdd},
            pt_balance = pt_balance + ${ptToAdd},
            updated_at = NOW()
        WHERE id = ${req.userId}
        RETURNING et_balance, pt_balance
      `;

      if (!updatedUser) {
        throw APIError.notFound("user not found");
      }

      // Record ET purchase transaction
      await tx.exec`
        INSERT INTO transactions (user_id, type, amount, currency, description)
        VALUES (${req.userId}, 'purchase', ${etToAdd}, 'ET', 'Token purchase')
      `;

      // Record PT bonus transaction
      await tx.exec`
        INSERT INTO transactions (user_id, type, amount, currency, description)
        VALUES (${req.userId}, 'bonus', ${ptToAdd}, 'PT', 'Purchase bonus')
      `;

      await tx.commit();

      const { checkAchievementsForUser } = await import("./check_achievements_internal");
      try {
        await checkAchievementsForUser(req.userId);
      } catch (err) {
        console.error("Failed to check achievements:", err);
      }

      return {
        etAdded: etToAdd,
        ptAdded: ptToAdd,
        newEtBalance: updatedUser.et_balance,
        newPtBalance: updatedUser.pt_balance,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
