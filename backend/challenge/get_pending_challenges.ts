import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
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

interface PendingChallengesResponse {
  challenges: PendingChallenge[];
}

export const getPendingChallenges = api(
  { method: "GET", path: "/challenge/pending", expose: true, auth: true },
  async (): Promise<PendingChallengesResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const challenges = await challengeDB.query<PendingChallenge>`
      SELECT 
        c.id,
        c.prediction_id as "predictionId",
        p.title as "predictionTitle",
        u.username as "challengerUsername",
        c.challenger_stake as "challengerStake",
        c.challenger_choice as "challengerChoice",
        c.created_at as "createdAt"
      FROM challenges c
      JOIN predictions p ON c.prediction_id = p.id
      JOIN users u ON c.challenger_id = u.id
      WHERE c.opponent_id = ${userId} AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `;

    return { challenges };
  }
);
