import { api } from "encore.dev/api";
import { challengeDB } from "./db";
import { user } from "~encore/clients";

interface AcceptChallengeRequest {
  userId: number;
  challengeId: number;
  choice: boolean;
}

interface AcceptChallengeResponse {
  message: string;
}

export const acceptChallenge = api(
  { method: "POST", path: "/challenge/accept", expose: true },
  async (req: AcceptChallengeRequest): Promise<AcceptChallengeResponse> => {
    const userId = req.userId;

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

    if (challenge.opponent_id !== userId) {
      throw new Error("Not authorized to accept this challenge");
    }

    if (challenge.status !== "pending") {
      throw new Error("Challenge already accepted or resolved");
    }

    await user.deductTokens({
      userId: userId,
      amount: challenge.challenger_stake,
      description: `Challenge acceptance for challenge ${req.challengeId}`,
    });

    await challengeDB.exec`
      UPDATE challenges 
      SET opponent_choice = ${req.choice}, 
          opponent_stake = ${challenge.challenger_stake},
          status = 'active',
          accepted_at = NOW()
      WHERE id = ${req.challengeId}
    `;

    const { checkAchievementsForUser } = await import("../user/check_achievements_internal");
    try {
      await checkAchievementsForUser(userId);
    } catch (err) {
      console.error("Failed to check achievements:", err);
    }

    return { message: "Challenge accepted successfully" };
  }
);
