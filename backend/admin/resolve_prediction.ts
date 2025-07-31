import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const predictionDB = SQLDatabase.named("prediction");
const userDB = SQLDatabase.named("user");

export interface ResolvePredictionRequest {
  predictionId: number;
  correctOption: string;
}

export interface ResolvePredictionResponse {
  success: boolean;
  winnersCount: number;
  totalPtDistributed: number;
}

// Resolves a prediction and distributes rewards (admin only).
export const resolvePrediction = api<ResolvePredictionRequest, ResolvePredictionResponse>(
  { expose: true, method: "POST", path: "/admin/predictions/:predictionId/resolve" },
  async (req) => {
    const tx = await predictionDB.begin();
    try {
      // Update prediction status
      const prediction = await tx.queryRow<{
        id: number;
        options: string[];
      }>`
        UPDATE predictions
        SET status = 'resolved',
            correct_option = ${req.correctOption},
            resolved_at = NOW()
        WHERE id = ${req.predictionId} AND status = 'open'
        RETURNING id, options
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

      let totalPtDistributed = 0;
      const userTx = await userDB.begin();

      try {
        // Distribute rewards (2x PT spent)
        for (const vote of winningVotes) {
          const reward = vote.pt_spent * 2;
          totalPtDistributed += reward;

          await userTx.exec`
            UPDATE users
            SET pt_balance = pt_balance + ${reward},
                streak = streak + 1,
                updated_at = NOW()
            WHERE id = ${vote.user_id}
          `;

          await userTx.exec`
            INSERT INTO transactions (user_id, type, amount, currency, description)
            VALUES (${vote.user_id}, 'win', ${reward}, 'PT', 'Prediction win reward')
          `;
        }

        // Reset streak for losing voters
        await userTx.exec`
          UPDATE users
          SET streak = 0,
              updated_at = NOW()
          WHERE id IN (
            SELECT DISTINCT user_id
            FROM votes
            WHERE prediction_id = ${req.predictionId}
            AND option_selected != ${req.correctOption}
          )
        `;

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
