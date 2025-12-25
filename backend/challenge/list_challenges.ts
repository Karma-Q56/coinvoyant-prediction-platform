import { api } from "encore.dev/api";
import { challengeDB } from "./db";

interface Challenge {
  id: number;
  predictionId: number;
  predictionTitle: string;
  challengerUsername: string;
  opponentUsername: string | null;
  challengerStake: number;
  opponentStake: number | null;
  challengerChoice: boolean;
  opponentChoice: boolean | null;
  status: string;
  winnerId: number | null;
  createdAt: Date;
  acceptedAt: Date | null;
  resolvedAt: Date | null;
}

interface ListChallengesRequest {
  userId: number;
}

interface ListChallengesResponse {
  challenges: Challenge[];
}

export const listChallenges = api(
  { method: "GET", path: "/challenge/list/:userId", expose: true },
  async (req: ListChallengesRequest): Promise<ListChallengesResponse> => {
    const userId = req.userId;

    const challenges = await challengeDB.query<Challenge>`
      SELECT 
        id,
        prediction_id as "predictionId",
        prediction_title as "predictionTitle",
        challenger_username as "challengerUsername",
        opponent_username as "opponentUsername",
        challenger_stake as "challengerStake",
        opponent_stake as "opponentStake",
        challenger_choice as "challengerChoice",
        opponent_choice as "opponentChoice",
        status,
        winner_id as "winnerId",
        created_at as "createdAt",
        accepted_at as "acceptedAt",
        resolved_at as "resolvedAt"
      FROM challenges
      WHERE challenger_id = ${userId} OR opponent_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const challengeArray: Challenge[] = [];
    for await (const challenge of challenges) {
      challengeArray.push(challenge);
    }
    
    return { challenges: challengeArray };
  }
);
