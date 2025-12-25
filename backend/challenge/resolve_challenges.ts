import { api } from "encore.dev/api";
import { challengeDB } from "./db";
import { prediction } from "~encore/clients";
import { user } from "~encore/clients";

interface ResolveChallengesRequest {
  predictionId: number;
}

interface ResolveChallengesResponse {
  resolvedCount: number;
}

export const resolveChallenges = api(
  { method: "POST", path: "/challenge/resolve/:predictionId", expose: false },
  async (req: ResolveChallengesRequest): Promise<ResolveChallengesResponse> => {
    let predictionInfo;
    try {
      predictionInfo = await prediction.getPrediction({ predictionId: req.predictionId });
    } catch {
      return { resolvedCount: 0 };
    }

    if (predictionInfo.status !== "resolved" || !predictionInfo.correctOption) {
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
      const correctAnswer = predictionInfo.correctOption === "true" || predictionInfo.correctOption === "Yes";
      
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
        await user.addTokens({
          userId: winnerId,
          amount: totalStake,
          description: "Head-to-Head Challenge Win",
        });

        await user.incrementH2HWins({
          userId: winnerId,
        });

        const { checkAchievementsForUser } = await import("../user/check_achievements_internal");
        try {
          await checkAchievementsForUser(winnerId);
        } catch (err) {
          console.error(`Failed to check achievements for user ${winnerId}:`, err);
        }
      } else {
        await user.addTokens({
          userId: challenge.challenger_id,
          amount: challenge.challenger_stake,
          description: "Head-to-Head Draw Refund",
        });

        await user.addTokens({
          userId: challenge.opponent_id,
          amount: challenge.opponent_stake,
          description: "Head-to-Head Draw Refund",
        });
      }

      resolvedCount++;
    }

    return { resolvedCount };
  }
);
