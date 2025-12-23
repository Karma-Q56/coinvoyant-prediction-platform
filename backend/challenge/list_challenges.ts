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
        c.id,
        c.prediction_id as "predictionId",
        p.title as "predictionTitle",
        u1.username as "challengerUsername",
        u2.username as "opponentUsername",
        c.challenger_stake as "challengerStake",
        c.opponent_stake as "opponentStake",
        c.challenger_choice as "challengerChoice",
        c.opponent_choice as "opponentChoice",
        c.status,
        c.winner_id as "winnerId",
        c.created_at as "createdAt",
        c.accepted_at as "acceptedAt",
        c.resolved_at as "resolvedAt"
      FROM challenges c
      JOIN predictions p ON c.prediction_id = p.id
      JOIN users u1 ON c.challenger_id = u1.id
      LEFT JOIN users u2 ON c.opponent_id = u2.id
      WHERE c.challenger_id = ${userId} OR c.opponent_id = ${userId}
      ORDER BY c.created_at DESC
      LIMIT 50
    `;

    const challengeArray: Challenge[] = [];
    for await (const challenge of challenges) {
      challengeArray.push(challenge);
    }
    
    return { challenges: challengeArray };
  }
);
