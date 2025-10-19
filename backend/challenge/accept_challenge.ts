import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { challengeDB } from "./db";

interface AcceptChallengeRequest {
  challengeId: number;
  choice: boolean;
}

interface AcceptChallengeResponse {
  message: string;
}

export const acceptChallenge = api(
  { method: "POST", path: "/challenge/accept", expose: true, auth: true },
  async (req: AcceptChallengeRequest): Promise<AcceptChallengeResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const challenge = await challengeDB.queryRow<{
      challenger_stake: number;
      opponent_id: number;
      status: string;
    }>`
      SELECT challenger_stake, opponent_id, status FROM challenges WHERE id = ${req.challengeId}
    `;

    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.opponent_id !== parseInt(userId)) {
      throw new Error("Not authorized to accept this challenge");
    }

    if (challenge.status !== "pending") {
      throw new Error("Challenge already accepted or resolved");
    }

    const userBalance = await challengeDB.queryRow<{ pt_balance: number }>`
      SELECT pt_balance FROM users WHERE id = ${userId}
    `;

    if (!userBalance || userBalance.pt_balance < challenge.challenger_stake) {
      throw new Error("Insufficient tokens");
    }

    await challengeDB.exec`
      UPDATE users SET pt_balance = pt_balance - ${challenge.challenger_stake} WHERE id = ${userId}
    `;

    await challengeDB.exec`
      UPDATE challenges 
      SET opponent_choice = ${req.choice}, 
          opponent_stake = ${challenge.challenger_stake},
          status = 'active',
          accepted_at = NOW()
      WHERE id = ${req.challengeId}
    `;

    return { message: "Challenge accepted successfully" };
  }
);
