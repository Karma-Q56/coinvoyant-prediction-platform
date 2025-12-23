import { api, APIError } from "encore.dev/api";
import { predictionDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const userDB = SQLDatabase.named("user");

export interface VoteRequest {
  userId: number;
  predictionId: number;
  option: string;
  ptAmount: number;
}

export interface VoteResponse {
  success: boolean;
  newPtBalance: number;
}

// Submits a vote on a prediction.
export const vote = api<VoteRequest, VoteResponse>(
  { expose: true, method: "POST", path: "/predictions/vote" },
  async (req) => {
    if (req.ptAmount <= 0) {
      throw APIError.invalidArgument("PT amount must be positive");
    }

    // Start transaction
    const tx = await predictionDB.begin();
    try {
      // Check if prediction exists and is open
      const prediction = await tx.queryRow<{
        id: number;
        status: string;
        options: string[];
        required_pt: number;
        closes_at: Date;
      }>`
        SELECT id, status, options, required_pt, closes_at
        FROM predictions
        WHERE id = ${req.predictionId}
      `;

      if (!prediction) {
        throw APIError.notFound("prediction not found");
      }

      if (prediction.status !== 'open') {
        throw APIError.failedPrecondition("prediction is not open for voting");
      }

      if (new Date() > prediction.closes_at) {
        throw APIError.failedPrecondition("prediction has closed");
      }

      if (!prediction.options.includes(req.option)) {
        throw APIError.invalidArgument("invalid option selected");
      }

      // Check minimum PT requirement (users can bet any amount above the minimum)
      if (req.ptAmount < prediction.required_pt) {
        throw APIError.invalidArgument(`minimum ${prediction.required_pt} PT required`);
      }

      // Check if user already voted
      const existingVote = await tx.queryRow`
        SELECT id FROM votes
        WHERE user_id = ${req.userId} AND prediction_id = ${req.predictionId}
      `;

      if (existingVote) {
        throw APIError.alreadyExists("user has already voted on this prediction");
      }

      // Check user's PT balance
      const userTx = await userDB.begin();
      try {
        const user = await userTx.queryRow<{
          pt_balance: number;
        }>`
          SELECT pt_balance FROM users WHERE id = ${req.userId}
        `;

        if (!user) {
          throw APIError.notFound("user not found");
        }

        if (user.pt_balance < req.ptAmount) {
          throw APIError.failedPrecondition("insufficient PT balance");
        }

        // Deduct PT from user
        const updatedUser = await userTx.queryRow<{
          pt_balance: number;
        }>`
          UPDATE users
          SET pt_balance = pt_balance - ${req.ptAmount},
              updated_at = NOW()
          WHERE id = ${req.userId}
          RETURNING pt_balance
        `;

        // Record the vote
        await tx.exec`
          INSERT INTO votes (user_id, prediction_id, option_selected, pt_spent)
          VALUES (${req.userId}, ${req.predictionId}, ${req.option}, ${req.ptAmount})
        `;

        // Record transaction
        await userTx.exec`
          INSERT INTO transactions (user_id, type, amount, currency, description)
          VALUES (${req.userId}, 'vote', ${-req.ptAmount}, 'PT', 'Vote on prediction')
        `;

        await userTx.commit();
        await tx.commit();

        const { checkAchievementsForUser } = await import("../user/check_achievements_internal");
        try {
          await checkAchievementsForUser(req.userId);
        } catch (err) {
          console.error("Failed to check achievements:", err);
        }

        return {
          success: true,
          newPtBalance: updatedUser!.pt_balance,
        };
      } catch (error) {
        await userTx.rollback();
        throw error;
      }
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
