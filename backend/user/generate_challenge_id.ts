import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { userDB } from "./db";

interface GenerateChallengeIdResponse {
  challengeId: string;
}

function generateRandomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const generateChallengeId = api(
  { method: "POST", path: "/user/generate-challenge-id", expose: true, auth: true },
  async (): Promise<GenerateChallengeIdResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const user = await userDB.queryRow<{ challenge_id: string | null }>`
      SELECT challenge_id FROM users WHERE id = ${userId}
    `;

    if (!user) {
      throw new Error("User not found");
    }

    if (user.challenge_id) {
      return { challengeId: user.challenge_id };
    }

    let challengeId = generateRandomId();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await userDB.queryRow`
        SELECT id FROM users WHERE challenge_id = ${challengeId}
      `;

      if (!existing) {
        break;
      }

      challengeId = generateRandomId();
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new Error("Failed to generate unique challenge ID");
    }

    await userDB.exec`
      UPDATE users SET challenge_id = ${challengeId} WHERE id = ${userId}
    `;

    return { challengeId };
  }
);
