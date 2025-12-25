import { api } from "encore.dev/api";
import { challengeDB } from "./db";

interface PendingChallenge {
  id: number;
  predictionId: number;
  predictionTitle: string;
  challengerUsername: string;
  challengerStake: number;
  challengerChoice: boolean;
  createdAt: Date;
}

interface PendingChallengesRequest {
  userId: number;
}

interface PendingChallengesResponse {
  challenges: PendingChallenge[];
}

export const getPendingChallenges = api(
  { method: "GET", path: "/challenge/pending/:userId", expose: true },
  async (req: PendingChallengesRequest): Promise<PendingChallengesResponse> => {
    const userId = req.userId;

    const challenges = await challengeDB.query<PendingChallenge>`
      SELECT 
        id,
        prediction_id as "predictionId",
        prediction_title as "predictionTitle",
        challenger_username as "challengerUsername",
        challenger_stake as "challengerStake",
        challenger_choice as "challengerChoice",
        created_at as "createdAt"
      FROM challenges
      WHERE opponent_id = ${userId} AND status = 'pending'
      ORDER BY created_at DESC
    `;

    const challengeArray: PendingChallenge[] = [];
    for await (const challenge of challenges) {
      challengeArray.push(challenge);
    }
    
    return { challenges: challengeArray };
  }
);
