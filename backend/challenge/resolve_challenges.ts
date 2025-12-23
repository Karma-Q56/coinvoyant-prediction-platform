import { api } from "encore.dev/api";
import { challengeDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const predictionDB = SQLDatabase.named("prediction");
const userDB = SQLDatabase.named("user");

interface ResolveChallengesRequest {
  predictionId: number;
}

interface ResolveChallengesResponse {
  resolvedCount: number;
}

export const resolveChallenges = api(
  { method: "POST", path: "/challenge/resolve/:predictionId", expose: false },
  async (req: ResolveChallengesRequest): Promise<ResolveChallengesResponse> => {
    const prediction = await predictionDB.queryRow<{
      correct_option: string | null;
      status: string;
    }>`
      SELECT correct_option, status FROM predictions WHERE id = ${req.predictionId}
    `;

    if (!prediction || prediction.status !== "resolved" || !prediction.correct_option) {
      return { resolvedCount: 0 };
    }

    const activeChallenges = await challengeDB.queryAll<{
      id: number;
      challenger_id: number;
      opponent_id: number;
      challenger_choice: boolean;
      opponent_choice: boolean;
      challenger_stake: number;
      opponent_stake: number;
    }>`
      SELECT id, challenger_id, opponent_id, challenger_choice, opponent_choice, 
             challenger_stake, opponent_stake
      FROM challenges
      WHERE prediction_id = ${req.predictionId} AND status = 'active'
    `;

    let resolvedCount = 0;

    for (const challenge of activeChallenges) {
      const correctAnswer = prediction.correct_option === "true" || prediction.correct_option === "Yes";
      
      let winnerId: number | null = null;
      let totalStake = challenge.challenger_stake + challenge.opponent_stake;

      if (challenge.challenger_choice === correctAnswer && challenge.opponent_choice !== correctAnswer) {
        winnerId = challenge.challenger_id;
      } else if (challenge.opponent_choice === correctAnswer && challenge.challenger_choice !== correctAnswer) {
        winnerId = challenge.opponent_id;
      }

      await challengeDB.exec`
        UPDATE challenges
        SET status = 'resolved',
            winner_id = ${winnerId},
            resolved_at = NOW()
        WHERE id = ${challenge.id}
      `;

      if (winnerId) {
        await userDB.exec`
          UPDATE users
          SET pt_balance = pt_balance + ${totalStake},
              head2head_wins = head2head_wins + 1,
              updated_at = NOW()
          WHERE id = ${winnerId}
        `;

        await userDB.exec`
          INSERT INTO transactions (user_id, type, amount, currency, description)
          VALUES (${winnerId}, 'h2h_win', ${totalStake}, 'PT', 'Head-to-Head Challenge Win')
        `;

        const { checkAchievementsForUser } = await import("../user/check_achievements_internal");
        try {
          await checkAchievementsForUser(winnerId);
        } catch (err) {
          console.error(`Failed to check achievements for user ${winnerId}:`, err);
        }
      } else {
        await userDB.exec`
          UPDATE users
          SET pt_balance = pt_balance + ${challenge.challenger_stake}
          WHERE id = ${challenge.challenger_id}
        `;

        await userDB.exec`
          UPDATE users
          SET pt_balance = pt_balance + ${challenge.opponent_stake}
          WHERE id = ${challenge.opponent_id}
        `;

        await userDB.exec`
          INSERT INTO transactions (user_id, type, amount, currency, description)
          VALUES (${challenge.challenger_id}, 'h2h_draw', ${challenge.challenger_stake}, 'PT', 'Head-to-Head Draw Refund')
        `;

        await userDB.exec`
          INSERT INTO transactions (user_id, type, amount, currency, description)
          VALUES (${challenge.opponent_id}, 'h2h_draw', ${challenge.opponent_stake}, 'PT', 'Head-to-Head Draw Refund')
        `;
      }

      resolvedCount++;
    }

    return { resolvedCount };
  }
);
