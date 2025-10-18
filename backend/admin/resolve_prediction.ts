import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const predictionDB = SQLDatabase.named("prediction");
const userDB = SQLDatabase.named("user");

export interface ResolvePredictionRequest {
  userId: number;
  predictionId: number;
  correctOption: string;
}

export interface ResolvePredictionResponse {
  success: boolean;
  winnersCount: number;
  totalPtDistributed: number;
}

// List of admin email addresses
const ADMIN_EMAILS = [
  "ragnarokq56@gmail.com",
];

// Resolves a prediction and distributes rewards (admin only).
export const resolvePrediction = api<ResolvePredictionRequest, ResolvePredictionResponse>(
  { expose: true, method: "POST", path: "/admin/predictions/:predictionId/resolve" },
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

    const tx = await predictionDB.begin();
    try {
      // Update prediction status
      const prediction = await tx.queryRow<{
        id: number;
        options: string[];
        odds: Record<string, number> | null;
      }>`
        UPDATE predictions
        SET status = 'resolved',
            correct_option = ${req.correctOption},
            resolved_at = NOW()
        WHERE id = ${req.predictionId} AND status = 'open'
        RETURNING id, options, odds
      `;

      if (!prediction) {
        throw APIError.notFound("prediction not found or already resolved");
      }

      if (!prediction.options.includes(req.correctOption)) {
        throw APIError.invalidArgument("invalid correct option");
      }

      // Get all winning votes
      const winningVotes = await tx.queryAll<{
        user_id: number;
        pt_spent: number;
      }>`
        SELECT user_id, pt_spent
        FROM votes
        WHERE prediction_id = ${req.predictionId}
        AND option_selected = ${req.correctOption}
      `;

      // Get all losing voters
      const losingVoters = await tx.queryAll<{
        user_id: number;
      }>`
        SELECT DISTINCT user_id
        FROM votes
        WHERE prediction_id = ${req.predictionId}
        AND option_selected != ${req.correctOption}
      `;

      let totalPtDistributed = 0;
      const userTx = await userDB.begin();

      try {
        const oddsMultiplier = prediction.odds?.[req.correctOption] || 2;
        
        for (const vote of winningVotes) {
          const reward = Math.floor(vote.pt_spent * oddsMultiplier);
          totalPtDistributed += reward;

          await userTx.exec`
            UPDATE users
            SET pt_balance = pt_balance + ${reward},
                streak = streak + 1,
                updated_at = NOW()
            WHERE id = ${vote.user_id}
          `;

          const description = `Prediction win reward (${oddsMultiplier}x)`;
          await userTx.exec`
            INSERT INTO transactions (user_id, type, amount, currency, description)
            VALUES (${vote.user_id}, 'win', ${reward}, 'PT', ${description})
          `;
        }

        // Reset streak for losing voters
        for (const loser of losingVoters) {
          await userTx.exec`
            UPDATE users
            SET streak = 0,
                updated_at = NOW()
            WHERE id = ${loser.user_id}
          `;
        }

        await userTx.commit();
        await tx.commit();

        return {
          success: true,
          winnersCount: winningVotes.length,
          totalPtDistributed,
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
