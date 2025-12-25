import { api } from "encore.dev/api";
import { challengeDB } from "./db";
import { user } from "~encore/clients";
import { prediction } from "~encore/clients";

interface CreateChallengeRequest {
  userId: number;
  predictionId: number;
  opponentChallengeId: string;
  stake: number;
  choice: boolean;
}

interface CreateChallengeResponse {
  id: number;
  message: string;
}

export const createChallenge = api(
  { method: "POST", path: "/challenge/create", expose: true },
  async (req: CreateChallengeRequest): Promise<CreateChallengeResponse> => {
    const userId = req.userId;

    const opponent = await user.findByChallengeId({ challengeId: req.opponentChallengeId });

    await user.deductTokens({
      userId: userId,
      amount: req.stake,
      description: `Challenge stake for prediction ${req.predictionId}`,
    });

    const predictionInfo = await prediction.getPrediction({ predictionId: req.predictionId });
    const challengerInfo = await user.getUsername({ userId: userId });

    const result = await challengeDB.queryRow<{ id: number }>`
      INSERT INTO challenges (
        prediction_id, 
        challenger_id, 
        opponent_id, 
        challenger_stake, 
        challenger_choice, 
        status,
        prediction_title,
        challenger_username,
        opponent_username
      )
      VALUES (
        ${req.predictionId}, 
        ${userId}, 
        ${opponent.id}, 
        ${req.stake}, 
        ${req.choice}, 
        'pending',
        ${predictionInfo.title},
        ${challengerInfo.username},
        ${opponent.username}
      )
      RETURNING id
    `;

    const { checkAchievementsForUser } = await import("../user/check_achievements_internal");
    try {
      await checkAchievementsForUser(userId);
    } catch (err) {
      console.error("Failed to check achievements:", err);
    }

    return {
      id: result!.id,
      message: "Challenge created successfully",
    };
  }
);
