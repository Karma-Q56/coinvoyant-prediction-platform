import { api, APIError } from "encore.dev/api";
import { sweepstakesDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const userDB = SQLDatabase.named("user");

export interface EnterSweepstakesRequest {
  userId: number;
  sweepstakesId: number;
}

export interface EnterSweepstakesResponse {
  success: boolean;
  newEtBalance?: number;
}

// Enters a user into a sweepstakes.
export const enter = api<EnterSweepstakesRequest, EnterSweepstakesResponse>(
  { expose: true, method: "POST", path: "/sweepstakes/enter" },
  async (req) => {
    // Start transaction
    const tx = await sweepstakesDB.begin();
    try {
      // Check if sweepstakes exists and is open
      const sweepstakes = await tx.queryRow<{
        id: number;
        entry_cost: number;
        is_open: boolean;
      }>`
        SELECT id, entry_cost, is_open
        FROM sweepstakes
        WHERE id = ${req.sweepstakesId}
      `;

      if (!sweepstakes) {
        throw APIError.notFound("sweepstakes not found");
      }

      if (!sweepstakes.is_open) {
        throw APIError.failedPrecondition("sweepstakes is closed");
      }

      let newEtBalance: number | undefined;

      // Handle ET cost if required
      if (sweepstakes.entry_cost > 0) {
        const userTx = await userDB.begin();
        try {
          const user = await userTx.queryRow<{
            et_balance: number;
          }>`
            SELECT et_balance FROM users WHERE id = ${req.userId}
          `;

          if (!user) {
            throw APIError.notFound("user not found");
          }

          if (user.et_balance < sweepstakes.entry_cost) {
            throw APIError.failedPrecondition("insufficient ET balance");
          }

          // Deduct ET from user
          const updatedUser = await userTx.queryRow<{
            et_balance: number;
          }>`
            UPDATE users
            SET et_balance = et_balance - ${sweepstakes.entry_cost},
                updated_at = NOW()
            WHERE id = ${req.userId}
            RETURNING et_balance
          `;

          // Record transaction
          await userTx.exec`
            INSERT INTO transactions (user_id, type, amount, currency, description)
            VALUES (${req.userId}, 'sweepstakes', ${-sweepstakes.entry_cost}, 'ET', 'Sweepstakes entry')
          `;

          await userTx.commit();
          newEtBalance = updatedUser!.et_balance;
        } catch (error) {
          await userTx.rollback();
          throw error;
        }
      }

      // Add entry
      await tx.exec`
        INSERT INTO sweepstakes_entries (sweepstakes_id, user_id)
        VALUES (${req.sweepstakesId}, ${req.userId})
      `;

      await tx.commit();

      return {
        success: true,
        newEtBalance,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
