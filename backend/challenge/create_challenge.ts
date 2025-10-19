import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { challengeDB } from "./db";

interface CreateChallengeRequest {
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
  { method: "POST", path: "/challenge/create", expose: true, auth: true },
  async (req: CreateChallengeRequest): Promise<CreateChallengeResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const opponent = await challengeDB.queryRow`
      SELECT id, pt_balance FROM users WHERE challenge_id = ${req.opponentChallengeId}
    `;

    if (!opponent) {
      throw new Error("Opponent not found");
    }

    const userBalance = await challengeDB.queryRow<{ pt_balance: number }>`
      SELECT pt_balance FROM users WHERE id = ${userId}
    `;

    if (!userBalance || userBalance.pt_balance < req.stake) {
      throw new Error("Insufficient tokens");
    }

    await challengeDB.exec`
      UPDATE users SET pt_balance = pt_balance - ${req.stake} WHERE id = ${userId}
    `;

    const result = await challengeDB.queryRow<{ id: number }>`
      INSERT INTO challenges (prediction_id, challenger_id, opponent_id, challenger_stake, challenger_choice, status)
      VALUES (${req.predictionId}, ${userId}, ${opponent.id}, ${req.stake}, ${req.choice}, 'pending')
      RETURNING id
    `;

    return {
      id: result!.id,
      message: "Challenge created successfully",
    };
  }
);
